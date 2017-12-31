'use strict';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { DocHead } from 'meteor/kadira:dochead';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { dbArena } from '/db/dbArena';
import { dbArenaFighters, getAttributeNumber, getTotalInvestedAmount } from '/db/dbArenaFighters';
import { dbCompanies } from '/db/dbCompanies';
import { dbDirectors } from '/db/dbDirectors';
import { dbEmployees } from '/db/dbEmployees';
import { dbLog } from '/db/dbLog';
import { dbOrders } from '/db/dbOrders';
import { dbProducts } from '/db/dbProducts';
import { dbSeason } from '/db/dbSeason';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { shouldStopSubscribe } from '../utils/idle';
import { inheritUtilForm, handleInputChange as inheritedHandleInputChange } from '../utils/form';

const rShowAllTags = new ReactiveVar(false);

inheritedShowLoadingOnSubscribing(Template.companyDetail);
Template.companyDetail.onCreated(function() {
  rShowAllTags.set(false);
  this.autorun(() => {
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      const companyData = dbCompanies.findOne(companyId);
      if (companyData) {
        DocHead.setTitle(Meteor.settings.public.websiteName + ' - 「' + companyData.companyName + '」公司資訊');
      }
    }
  });
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('companyDetail', companyId);
    }
  });
});
Template.companyDetail.helpers({
  companyData() {
    const companyId = FlowRouter.getParam('companyId');

    return dbCompanies.findOne(companyId);
  }
});

Template.companyDetailContentNormal.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('employeeListByCompany', companyId);
    }
  });
});
Template.companyDetailContentNormal.helpers({
  getManageHref(companyId) {
    return FlowRouter.path('editCompany', {companyId});
  },
  showAllTags(tags) {
    if (tags && tags.length <= 4) {
      return true;
    }

    return rShowAllTags.get();
  },
  firstFewTags(tags) {
    return tags && tags.slice(0, 3);
  },
  haveNextSeasonProduct() {
    const companyId = this._id;
    const overdue = 0;
    window.dbProducts = dbProducts;

    return dbProducts.find({companyId, overdue}).count() > 0;
  },
  canUpdateSalary() {
    const seasonData = dbSeason
      .findOne({}, {
        sort: {
          beginDate: -1
        }
      });
    if (! seasonData) {
      return false;
    }

    return Date.now() < seasonData.endDate.getTime() - Meteor.settings.public.announceSalaryTime;
  },
  canUpdateSeasonalBonus() {
    const seasonData = dbSeason
      .findOne({}, {
        sort: {
          beginDate: -1
        }
      });
    if (! seasonData) {
      return false;
    }

    return Date.now() < seasonData.endDate.getTime() - Meteor.settings.public.announceBonusTime;
  },
  isEmployee() {
    const userId = Meteor.userId();
    const companyId = FlowRouter.getParam('companyId');
    const employed = false;
    const resigned = false;

    return dbEmployees.find({companyId, userId, employed, resigned}).count() > 0;
  }
});
Template.companyDetailContentNormal.events({
  'click [data-action="showAllTags"]'(event) {
    event.preventDefault();
    rShowAllTags.set(true);
  }
});

//是否展開面板
const rDisplayPanelList = new ReactiveVar([]);
Template.companyDetailTable.helpers({
  isDisplayPanel(panelType) {
    return _.contains(rDisplayPanelList.get(), panelType);
  },
  priceDisplayClass(lastPrice, listPrice) {
    if (lastPrice > listPrice) {
      return 'text-danger';
    }
    else if (listPrice > lastPrice) {
      return 'text-success';
    }
  }
});
Template.companyDetailTable.events({
  'click [data-toggle-panel]'(event) {
    event.preventDefault();
    const $emitter = $(event.currentTarget);
    const panelType = $emitter.attr('data-toggle-panel');
    const displayPanelList = rDisplayPanelList.get();
    if (_.contains(displayPanelList, panelType)) {
      rDisplayPanelList.set(_.without(displayPanelList, panelType));
    }
    else {
      displayPanelList.push(panelType);
      rDisplayPanelList.set(displayPanelList);
    }
  }
});

Template.companyChart.onRendered(function() {
  this.strChartType = 'trend';
  this.$chart = this.$('.chart');
  this.chart = null;
  this.autorun(() => {
    drawChart(this);
  });
});
Template.companyChart.events({
  'click [data-chart-type]'(event, templateInstance) {
    event.preventDefault();
    const chartType = $(event.currentTarget).attr('data-chart-type');
    $('.company-detail .company-chart-btn-group > .active').removeClass('active');
    $('.company-detail .company-chart-btn-group')
      .find('[data-chart-type="' + chartType + '"]')
      .addClass('active');
    templateInstance.strChartType = chartType;
    drawChart(templateInstance);
  }
});
function drawChart(templateInstance) {
  if (templateInstance.strChartType === 'trend') {
    drawLineChart(templateInstance);
  }
  else {
    drawCandleStickChart(templateInstance);
  }
}
function drawLineChart(templateInstance) {
  if (! Meteor.status().connected) {
    return false;
  }
  if (templateInstance.chart) {
    templateInstance.chart.destroy();
  }
  const companyId = FlowRouter.getParam('companyId');
  Meteor.call('queryStocksPrice', companyId, (error, result) => {
    if (error) {
      return false;
    }
    if (! result.length) {
      return false;
    }
    templateInstance.$chart
      .empty()
      .html('<canvas style="height:300px;"></canvas>');
    const ctx = templateInstance.$chart.find('canvas');
    const color = (localStorage.getItem('theme') === 'light') ? '#000000' : '#ffffff';
    templateInstance.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '一日股價走勢',
            lineTension: 0,
            data: _.sortBy(result, 'x'),
            borderColor: color,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        legend: {
          onClick: $.noop,
          labels: {
            fontColor: color
          }
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              position: 'bottom',
              gridLines: {
                drawTicks: true
              },
              scaleLabel: {
                display: false
              },
              ticks: {
                autoSkip: true,
                autoSkipPadding: 10,
                round: true,
                maxRotation: 0,
                padding: 5,
                fontColor: color
              },
              time: {
                parser: 'x',
                tooltipFormat: 'YYYY/MM/DD HH:mm:ss',
                displayFormats: {
                  year: 'YYYY',
                  quarter: 'YYYY Qo',
                  month: 'YYYY/MM',
                  week: 'YYYY/MM/DD',
                  day: 'YYYY/MM/DD',
                  hour: 'MM/DD HH:mm',
                  minute: 'MM/DD HH:mm',
                  second: 'HH:mm:ss',
                  millisecond: 'mm:ss.SSS'
                }
              }
            }
          ],
          yAxes: [
            {
              type: 'linear',
              position: 'left',
              gridLines: {
                drawTicks: true
              },
              ticks: {
                fontColor: color,
                beginAtZero: true,
                callback: function(value) {
                  return '$' + Math.round(value).toLocaleString();
                }
              },
              afterBuildTicks(axis) {
                axis.ticks = _.uniq(
                  axis.ticks.map((n) => {
                    return Math.round(n);
                  })
                );
              }
            }
          ]
        }
      }
    });
  });
}
function drawCandleStickChart(templateInstance) {
  if (! Meteor.status().connected) {
    return false;
  }
  if (templateInstance.chart) {
    templateInstance.chart.destroy();
  }
  templateInstance.$chart.empty();
  templateInstance.$chart.find('text').css('fill');

  const margin = { top: 20, right: 10, bottom: 30, left: 45 };
  const width = Math.max(templateInstance.$chart.width() - margin.right - margin.left, 450);
  const height = 300 - margin.top - margin.bottom;
  const color = localStorage.theme === 'light' ? '#000' : '#fff';

  const svg = d3.select(templateInstance.$chart.get(0)).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const x = techan.scale.financetime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);
  const candlestick = techan.plot.candlestick().xScale(x)
    .yScale(y);
  const xAxis = d3.axisBottom().scale(x);

  const count = 80;
  const unitTime = (templateInstance.strChartType === '30min' ? 1800
    : templateInstance.strChartType === '60min' ? 3600
      : templateInstance.strChartType === '4hr' ? 14400
        : templateInstance.strChartType === '12hr' ? 43200 : 86400) * 1000;
  const toTime = Math.floor(new Date(Meteor.settings.public.lastRoundEndTime).getTime() / unitTime) * unitTime;

  const companyId = FlowRouter.getParam('companyId');
  Meteor.call('queryStocksCandlestick', companyId, { lastTime: toTime, unitTime: unitTime, count: count }, (error, result) => {
    if (error) {
      return false;
    }
    const data = result.map(function(x) {
      return {
        date: new Date(x.time),
        open: x.open,
        close: x.close,
        high: x.high,
        low: x.low
      };
    });
    const accessor = candlestick.accessor();
    const grid = svg.append('g').attr('class', 'grid');
    const content = svg.append('g').attr('class', 'content');

    content.append('g')
      .attr('class', 'candlestick');

    content.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')');

    content.append('g')
      .attr('class', 'y axis')
      .append('text')
      .attr('y', -6)
      .style('text-anchor', 'end')
      .text('價格 ($)');

    x.domain(Array.from(new Array(count), (v, i) => {
      return new Date(toTime - unitTime * (count - i));
    }));

    let yDomain = techan.scale.plot.ohlc(data, accessor).domain();
    y.domain(techan.scale.plot.ohlc(data, accessor).domain());

    // 自訂y軸，避免小數情況出現
    yDomain = yDomain.map((n) => {
      return Math.round(n);
    }).sort((a, b) => {
      return (a - b);
    });

    const yDomainMin = _.first(yDomain);
    const yDomainMax = _.last(yDomain);
    const yTickMaxCount = 10;
    const yTickStep = Math.max(Math.floor((yDomainMax - yDomainMin) / yTickMaxCount), 1);

    const yTickValues = Array.from(new Array(yTickMaxCount + 1), (v, i) => {
      return yDomainMax - yTickStep * i;
    }).filter((n) => {
      return n >= yDomainMin;
    });

    const yAxis = d3.axisLeft().scale(y)
      .tickValues(yTickValues)
      .tickFormat(d3.format('d'));

    grid.call(d3.axisLeft().scale(y)
      .tickSize(-width)
      .ticks(yTickValues.length)
      .tickFormat(''));

    svg.selectAll('g.candlestick').datum(data)
      .call(candlestick);
    svg.selectAll('g.x.axis').call(xAxis);
    svg.selectAll('g.y.axis').call(yAxis);
    svg.select('.content').selectAll('line')
      .style('stroke', color);
    svg.select('.content').selectAll('path')
      .style('stroke', color);
    svg.selectAll('text').style('fill', color);
    svg.selectAll('path.candle').style('stroke', color);
  });
}

//定時呼叫取得今日交易量資料
const rTodayDealAmount = new ReactiveVar(0);
Template.companyTodayDealAmount.onCreated(function() {
  if (! Meteor.status().connected) {
    return false;
  }
  const companyId = FlowRouter.getParam('companyId');
  if (companyId) {
    Meteor.call('queryTodayDealAmount', companyId, (error, result) => {
      if (! error) {
        rTodayDealAmount.set(result);
      }
    });
  }
});
Template.companyTodayDealAmount.helpers({
  getTodayDealAmount() {
    return rTodayDealAmount.get();
  }
});

const rBuyOrderOffset = new ReactiveVar(0);
const rSellOrderOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.companyBuyOrderList);
Template.companyBuyOrderList.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    if (Meteor.user()) {
      this.subscribe('queryMyOrder');
      this.subscribe('queryOwnStocks');
    }
  });
  rBuyOrderOffset.set(0);
  rSellOrderOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('companyOrderExcludeMe', companyId, '購入', rBuyOrderOffset.get());
      this.subscribe('companyOrderExcludeMe', companyId, '賣出', rSellOrderOffset.get());
    }
  });
});
Template.companyBuyOrderList.helpers({
  myOrderList() {
    const companyId = this._id;
    const user = Meteor.user();
    if (user) {
      const userId = user._id;

      return dbOrders.find(
        {
          companyId: companyId,
          orderType: '購入',
          userId: userId
        },
        {
          sort: {
            unitPrice: -1,
            createdAt: 1
          }
        }
      );
    }
  },
  orderList() {
    const companyId = this._id;
    const filter = {
      companyId: companyId,
      orderType:  '購入'
    };
    const user = Meteor.user();
    if (user) {
      filter.userId = {
        $ne: user._id
      };
    }

    return dbOrders.find(filter, {
      sort: {
        unitPrice: -1,
        createdAt: 1
      },
      limit: 10
    });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfCompanyOrder購入',
      dataNumberPerPage: 10,
      offset: rBuyOrderOffset
    };
  }
});

Template.companySellOrderList.helpers({
  getStockAmount() {
    return getStockAmount(this._id);
  },
  myOrderList() {
    const companyId = this._id;
    const user = Meteor.user();
    if (user) {
      const userId = user._id;

      return dbOrders.find(
        {
          companyId: companyId,
          orderType: '賣出',
          userId: userId
        },
        {
          sort: {
            unitPrice: 1,
            createdAt: 1
          },
          limit: rSellOrderOffset.get() + 10
        }
      );
    }
  },
  orderList() {
    const companyId = this._id;
    const filter = {
      companyId: companyId,
      orderType:  '賣出'
    };
    const user = Meteor.user();
    if (user) {
      filter.userId = {
        $ne: user._id
      };
    }

    return dbOrders.find(filter, {
      sort: {
        unitPrice: 1,
        createdAt: 1
      },
      limit: 10
    });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfCompanyOrder賣出',
      dataNumberPerPage: 10,
      offset: rSellOrderOffset
    };
  }
});

inheritedShowLoadingOnSubscribing(Template.companyCurrentProductList);
Template.companyCurrentProductList.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    if (Meteor.user()) {
      const companyId = FlowRouter.getParam('companyId');
      if (companyId) {
        this.subscribe('queryMyLikeProduct', companyId);
      }
    }
  });
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('companyCurrentProduct', companyId);
      this.subscribe('productListByCompany', {
        companyId: companyId,
        sortBy: 'likeCount',
        sortDir: -1,
        offset: 0
      });
    }
  });
});
Template.companyCurrentProductList.helpers({
  productList() {
    const companyId = this._id;
    const overdue = 1;

    return dbProducts.find({companyId, overdue}, {
      sort: {
        createdAt: -1
      }
    });
  }
});
Template.companyCurrentProductList.events({
  'click [data-vote-product]'(event) {
    event.preventDefault();
  }
});

Template.companyAllPrudctList.helpers({
  productCenterHref() {
    return FlowRouter.path('productCenterByCompany', {
      companyId: this._id
    });
  },
  productList() {
    const companyId = this._id;

    return dbProducts.find(
      {
        companyId: companyId,
        overdue: {
          $gt: 0
        }
      },
      {
        sort: {
          likeCount: -1,
          createdAt: -1
        },
        limit: 10
      });
  }
});
Template.companyAllPrudctList.events({
  'click [data-like-product]'(event) {
    event.preventDefault();
  }
});

const rDirectorOffset = new ReactiveVar(0);
const rShowSupporterList = new ReactiveVar(null);
inheritedShowLoadingOnSubscribing(Template.companyDirectorList);
Template.companyDirectorList.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    if (Meteor.user()) {
      this.subscribe('queryOwnStocks');
    }
  });
  rDirectorOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('companyDirector', companyId, rDirectorOffset.get());
    }
  });
});
Template.companyDirectorList.helpers({
  directorList() {
    const companyId = this._id;

    return dbDirectors.find({companyId}, {
      sort: {
        stocks: -1,
        createdAt: 1
      }
    });
  },
  getPercentage(stocks) {
    const templateInstance = Template.instance();

    return Math.round(stocks / templateInstance.data.totalRelease * 10000) / 100;
  },
  getMessage(message) {
    return message || '無';
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfCompanyDirector',
      dataNumberPerPage: 10,
      offset: rDirectorOffset
    };
  },
  getStockAmount(companyId) {
    return getStockAmount(companyId);
  },
  getMyMessage(companyId) {
    const userId = Meteor.user()._id;

    return dbDirectors.findOne({companyId, userId}).message;
  },
  isDirectorInVacation(userId) {
    const user = Meteor.users.findOne(userId);

    return user ? user.profile.isInVacation : false;
  }
});

Template.companyElectInfo.helpers({
  inElect() {
    const candidateList = this.candidateList;

    return candidateList && candidateList.length > 1;
  },
  canContendManager() {
    const user = Meteor.user();
    if (user && ! user.profile.revokeQualification) {
      return ! _.contains(this.candidateList, user._id);
    }

    return false;
  },
  getSupportPercentage(candidateIndex) {
    const instanceData = Template.instance().data;
    const supportStocksList = instanceData.supportStocksList;
    const supportStocks = supportStocksList ? supportStocksList[candidateIndex] : 0;

    return Math.round(supportStocks / instanceData.totalRelease * 10000) / 100;
  },
  supportList(candidateIndex) {
    const instance = Template.instance();

    return instance.data.voteList[candidateIndex];
  },
  getStockAmount() {
    const instance = Template.instance();
    const instanceData = instance.data;

    return getStockAmount(instanceData._id);
  },
  showSupportListDialog() {
    return rShowSupporterList.get() !== null;
  }
});
Template.companyElectInfo.events({
  'click [data-show-supporter]'(event, templateInstance) {
    event.preventDefault();
    const instanceData = templateInstance.data;
    const candidateIndex = parseInt($(event.currentTarget).attr('data-show-supporter'), 10);
    const option = {
      candidateId: instanceData.candidateList[candidateIndex],
      voteList: instanceData.voteList[candidateIndex]
    };

    rShowSupporterList.set(option);
  }
});

//取得當前使用者持有指定公司的股份數量
function getStockAmount(companyId) {
  const user = Meteor.user();
  if (user) {
    const userId = user._id;
    const ownStockData = dbDirectors.findOne({companyId, userId});

    return ownStockData ? ownStockData.stocks : 0;
  }
  else {
    return 0;
  }
}

Template.supporterListDialog.helpers({
  candidateId() {
    return rShowSupporterList.get().candidateId;
  },
  supporters() {
    return rShowSupporterList.get().voteList;
  }
});

Template.supporterListDialog.events({
  'click .btn'(event) {
    event.preventDefault();
    rShowSupporterList.set(null);
  }
});

inheritedShowLoadingOnSubscribing(Template.companyEmployeeList);
Template.companyEmployeeList.helpers({
  employeeList() {
    const companyId = FlowRouter.getParam('companyId');
    const employed = true;

    return dbEmployees.find({companyId, employed}, {
      sort: {
        registerAt: 1
      }
    });
  },
  nextSeasonEmployeeList() {
    const companyId = FlowRouter.getParam('companyId');
    const employed = false;

    return dbEmployees.find({companyId, employed}, {
      sort: {
        registerAt: 1
      }
    });
  },
  isCurrentUserEmployed() {
    const userId = Meteor.userId();
    const companyId = FlowRouter.getParam('companyId');

    if (! userId) {
      return false;
    }

    return dbEmployees.find({ companyId, userId, employed: true }).count() > 0;
  },
  showMessage(message) {
    return message || '無';
  },
  getMyMessage() {
    const userId = Meteor.userId();
    const companyId = FlowRouter.getParam('companyId');

    const employeeData = dbEmployees.findOne({ companyId, userId, employed: true });
    if (! employeeData) {
      return '';
    }

    return employeeData.message;
  }
});

inheritedShowLoadingOnSubscribing(Template.companyArenaInfo);
Template.companyArenaInfo.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('companyArenaInfo', companyId);
    }
  });
});
Template.companyArenaInfo.helpers({
  currentArenaLinkHref() {
    const arenaData = dbArena.findOne({}, {
      sort: {
        beginDate: -1
      }
    });
    const arenaId = arenaData._id;

    return FlowRouter.path('arenaInfo', {arenaId});
  },
  currentArenaData() {
    const arenaData = dbArena.findOne({}, {
      sort: {
        beginDate: -1
      }
    });
    if (arenaData) {
      arenaData.companyData = this;
      arenaData.joinData = dbArenaFighters.findOne({
        arenaId: arenaData._id,
        companyId: this._id
      });

      return arenaData;
    }
    else {
      return false;
    }
  },
  getAttributeNumber(attribute, number) {
    return getAttributeNumber(attribute, number);
  },
  inCanJoinTime() {
    return Date.now() < this.joinEndDate.getTime();
  },
  totalInvestedAmount() {
    return getTotalInvestedAmount(this);
  },
  arenaMinInvestedAmount() {
    return Meteor.settings.public.arenaMinInvestedAmount;
  },
  notEnoughInvestedAmount() {
    return getTotalInvestedAmount(this) < Meteor.settings.public.arenaMinInvestedAmount;
  }
});

inheritUtilForm(Template.arenaStrategyForm);
const rSortedAttackSequence = new ReactiveVar([]);
Template.arenaStrategyForm.onCreated(function() {
  this.validateModel = validateStrategyModel;
  this.handleInputChange = handleStrategyInputChange;
  this.saveModel = saveStrategyModel;
  this.model.set(this.data.joinData);
  this.draggingIndex = null;
  rSortedAttackSequence.set([]);
});
Template.arenaStrategyForm.onRendered(function() {
  this.model.set(this.data.joinData);
});
function validateStrategyModel(model) {
  const error = {};

  if (model.spCost > getAttributeNumber('sp', model.sp)) {
    error.spCost = '特攻消耗數值不可超過角色的SP值！';
  }
  else if (model.spCost < 1) {
    error.spCost = '特攻消耗數值不可低於1！';
  }
  else if (model.spCost > 10) {
    error.spCost = '特攻消耗數值不可高於10！';
  }

  if (_.size(error) > 0) {
    return error;
  }
}
function handleStrategyInputChange(event) {
  switch (event.currentTarget.name) {
    case 'spCost': {
      const model = this.model.get();
      model.spCost = parseInt(event.currentTarget.value, 10);
      this.model.set(model);
      break;
    }
    case 'normalManner': {
      const model = this.model.get();
      model.normalManner = this.$input
        .filter('[name="normalManner"]')
        .map((index, input) => {
          return input.value;
        })
        .toArray();
      this.model.set(model);
      break;
    }
    case 'specialManner': {
      const model = this.model.get();
      model.specialManner = this.$input
        .filter('[name="specialManner"]')
        .map((index, input) => {
          return input.value;
        })
        .toArray();
      this.model.set(model);
      break;
    }
    default: {
      inheritedHandleInputChange.call(this, event);
      break;
    }
  }
}
function saveStrategyModel(model) {
  const submitData = _.pick(model, 'spCost', 'normalManner', 'specialManner');
  submitData.attackSequence = rSortedAttackSequence.get();
}
Template.arenaStrategyForm.helpers({
  spForecast() {
    const sp = getAttributeNumber('sp', this.joinData.sp);
    const model = Template.instance().model.get();
    const spCost = model.spCost;
    const tenRoundForecast = Math.floor(Math.min((sp + 1) / spCost, spCost));
    const maximumRound = Meteor.settings.public.arenaMaximumRound;
    const maximumForecast = Math.floor(Math.min((sp + Math.floor(maximumRound / 10)) / spCost, spCost / 10 * maximumRound));


    return `目前的SP量為 ${sp}
      ，在 10 回合的戰鬥中估計可以發出 ${tenRoundForecast} 次特殊攻擊，
      在 ${maximumRound} 回合的戰鬥中估計可以發出 ${maximumForecast} 次特殊攻擊。`;
  },
  getManner(type, index) {
    const model = Template.instance().model.get();
    const fieldName = type + 'Manner';

    return model[fieldName][index];
  },
  hasEnemy() {
    return this.shuffledFighterCompanyIdList.length > 0;
  },
  enemyList() {
    const shuffledFighterCompanyIdList = this.shuffledFighterCompanyIdList;
    const model = Template.instance().model.get();

    return _.map(model.attackSequence, (attackIndex) => {
      return {
        _id: attackIndex,
        companyId: shuffledFighterCompanyIdList[attackIndex]
      };
    });
  },
  notSorted(index) {
    return ! _.contains(rSortedAttackSequence.get(), index);
  },
  sortedEnemyList() {
    const shuffledFighterCompanyIdList = this.shuffledFighterCompanyIdList;

    return _.map(rSortedAttackSequence.get(), (attackIndex) => {
      return {
        _id: attackIndex,
        companyId: shuffledFighterCompanyIdList[attackIndex]
      };
    });
  }
});

const rIsOnlyShowMine = new ReactiveVar(false);
const rLogOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.companyLogList);
Template.companyLogList.onCreated(function() {
  rLogOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const companyId = FlowRouter.getParam('companyId');
    if (companyId) {
      this.subscribe('companyLog', companyId, rIsOnlyShowMine.get(), rLogOffset.get());
    }
  });
});
Template.companyLogList.helpers({
  onlyShowMine() {
    return rIsOnlyShowMine.get();
  },
  logList() {
    const companyId = FlowRouter.getParam('companyId');

    return dbLog.find({companyId}, {
      sort: {
        createdAt: -1
      },
      limit: 30
    });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfcompanyLog',
      dataNumberPerPage: 30,
      offset: rLogOffset
    };
  }
});
Template.companyLogList.events({
  'click button'(event) {
    event.preventDefault();
    rIsOnlyShowMine.set(! rIsOnlyShowMine.get());
  }
});
