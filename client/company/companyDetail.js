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
import { dbSeason } from '/db/dbSeason';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { shouldStopSubscribe } from '../utils/idle';
import { currencyFormat, setChartTheme } from '../utils/helpers.js';
import { inheritUtilForm, handleInputChange as inheritedHandleInputChange } from '../utils/form';
import { globalVariable } from '../utils/globalVariable';

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
  showAllTags(tags) {
    if (tags && tags.length <= 4) {
      return true;
    }

    return rShowAllTags.get();
  },
  firstFewTags(tags) {
    return tags && tags.slice(0, 3);
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
  }
});
Template.companyDetailContentNormal.events({
  'click [data-action="showAllTags"]'(event) {
    event.preventDefault();
    rShowAllTags.set(true);
  }
});

// 是否展開面板
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

Template.companyChart.onCreated(function() {
  this.strChartType = '';
  this.$chart = null;
});
Template.companyChart.onRendered(function() {
  this.strChartType = 'trend';
  this.$chart = this.$('.chart');
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
  switch (globalVariable.get('theme')) {
    case 'dark':
      setChartTheme('gray');
      break;
    default:
      setChartTheme('gridLight');
      break;
  }

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
  if (templateInstance.$chart) {
    templateInstance.$chart.empty();
  }

  const toTime = new Date(Meteor.settings.public.lastRoundEndTime).getTime();
  const fromTime = toTime - 1000 * 60 * 60 * 24;
  const companyId = FlowRouter.getParam('companyId');
  Meteor.call('queryStocksPrice', companyId, { begin: fromTime }, (error, result) => {
    if (error) {
      return false;
    }

    Highcharts.chart({
      chart: {
        type: 'line',
        renderTo: templateInstance.$chart[0]
      },
      title: {
        text: '一日股價走勢',
        margin: 0
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          x: -4,
          formatter: function() {
            return '$' + currencyFormat(this.value);
          }
        },
        allowDecimals: false,
        min: 0,
        minTickInterval: 1,
        tickPixelInterval: 50
      },
      xAxis: {
        type: 'datetime',
        min: fromTime,
        max: toTime,
        gridLineWidth: 1,
        tickWidth: 0,
        tickPixelInterval: 75
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      series: [
        {
          name: '價格',
          data: _.sortBy(result, 'x'),
          marker: {
            enabled: true
          },
          tooltip: {
            valueDecimals: 0,
            xDateFormat: '%H:%M:%S',
            pointFormatter: function() {
              return '<span style="color:' +
                this.color +
                '">\u25CF</span> ' +
                this.series.name +
                ': <b>$' +
                currencyFormat(this.y) +
                '</b><br/>';
            }
          }
        }
      ]
    });
  });
}

function drawCandleStickChart(templateInstance) {
  if (! Meteor.status().connected) {
    return false;
  }
  if (templateInstance.$chart) {
    templateInstance.$chart.empty();
  }

  const unitTime = (templateInstance.strChartType === '1hr' ? 3600
    : templateInstance.strChartType === '2hr' ? 7200
      : templateInstance.strChartType === '4hr' ? 14400
        : templateInstance.strChartType === '12hr' ? 43200 : 86400) * 1000;

  const count = Math.min(Math.floor((1000 * 86400 * 14) / unitTime) - 1, 40);

  const toTime = Math.floor(new Date(Meteor.settings.public.lastRoundEndTime).getTime() / unitTime) * unitTime;
  const fromTime = toTime - unitTime * (count - 1);

  const companyId = FlowRouter.getParam('companyId');
  Meteor.call('queryStocksCandlestick', companyId, { lastTime: toTime, unitTime: unitTime, count: count }, (error, result) => {
    if (error) {
      return false;
    }

    const data = _.map(result, (val) => {
      const newVal = {
        x: val.time,
        open: val.open,
        high: val.high,
        low: val.low,
        close: val.close
      };

      return newVal;
    });

    Highcharts.stockChart({
      chart: {
        renderTo: templateInstance.$chart[0]
      },
      title: {
        text: null
      },
      rangeSelector: {
        enabled: false
      },
      scrollbar: {
        enabled: false
      },
      navigator: {
        enabled: false
      },
      yAxis: {
        title: {
          text: null
        },
        labels: {
          x: -4,
          y: 3,
          align: 'right',
          formatter: function() {
            return '$' + currencyFormat(this.value);
          }
        },
        allowDecimals: false,
        opposite: false,
        showLastLabel: true,
        minTickInterval: 1,
        tickPixelInterval: 50
      },
      xAxis: {
        type: 'datetime',
        min: fromTime,
        max: toTime,
        startOnTick: true,
        gridLineWidth: 1,
        minTickInterval: 1,
        tickWidth: 0,
        tickPixelInterval: 75,
        ordinal: false
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      series: [
        {
          name: '成交價',
          type: 'candlestick',
          data: data,
          cropThreshold: count,
          maxPointWidth: 10,
          color: '#449d44',
          lineColor: '#449d44',
          upLineColor: '#d9534f',
          upColor: '#d9534f',
          tooltip: {
            valueDecimals: 0,
            xDateFormat: '%m/%d %H:%M',
            pointFormatter: function() {
              return (
                'Open: <b>$' +
                currencyFormat(this.options.open) +
                '</b><br/>' +
                'High: <b>$' +
                currencyFormat(this.options.high) +
                '</b><br/>' +
                'Low: <b>$' +
                currencyFormat(this.options.low) +
                '</b><br/>' +
                'Close: <b>$' +
                currencyFormat(this.options.close) +
                '</b><br/>'
              );
            }
          }
        }
      ]
    });
  });
}

// 定時呼叫取得今日交易量資料
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

    return dbDirectors.find({ companyId }, {
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
  isDirectorInVacation(userId) {
    const user = Meteor.users.findOne(userId);

    return user ? user.profile.isInVacation : false;
  }
});

Template.companyElectInfo.helpers({
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

    return dbEmployees.find({ companyId, employed }, {
      sort: {
        registerAt: 1
      }
    });
  },
  nextSeasonEmployeeList() {
    const companyId = FlowRouter.getParam('companyId');
    const employed = false;

    return dbEmployees.find({ companyId, employed }, {
      sort: {
        registerAt: 1
      }
    });
  },
  showMessage(message) {
    return message || '無';
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

    return FlowRouter.path('arenaInfo', { arenaId });
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

    return dbLog.find({ companyId }, {
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
