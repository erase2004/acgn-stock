'use strict';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { DocHead } from 'meteor/kadira:dochead';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { dbLog, accuseLogTypeList } from '/db/dbLog';
import { dbCompanies } from '/db/dbCompanies';
import { dbDirectors } from '/db/dbDirectors';
import { dbEmployees } from '/db/dbEmployees';
import { dbTaxes } from '/db/dbTaxes';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { shouldStopSubscribe } from '../utils/idle';
import { accountInfoCommonHelpers } from './helpers';

inheritedShowLoadingOnSubscribing(Template.accountInfo);
Template.accountInfo.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountInfo', userId);
    }
  });
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('employeeListByUser', userId);
    }
  });
  this.autorun(() => {
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      const user = Meteor.users.findOne(userId);
      if (user) {
        DocHead.setTitle(Meteor.settings.public.websiteName + ' - 「' + user.profile.name + '」帳號資訊');
      }
    }
  });
});
//是否展開面板
const rDisplayPanelList = new ReactiveVar([]);
Template.accountInfo.helpers({
  lookUser() {
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      return Meteor.users.findOne(userId);
    }
    else {
      return null;
    }
  },
  isDisplayPanel(panelType) {
    return _.contains(rDisplayPanelList.get(), panelType);
  }
});
Template.accountInfo.events({
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

Template.accountInfoBasic.helpers({
  ...accountInfoCommonHelpers,
  showValidateType() {
    switch (this.profile.validateType) {
      case 'Google': {
        return '【Google帳號】' + this.services.google.email;
      }
      case 'PTT': {
        return '【PTT帳號】' + this.username;
      }
      case 'Bahamut': {
        return '【巴哈姆特帳號】' + this.username.replace('?', '');
      }
    }
  },
  showUnregisterEmployee() {
    const userId = FlowRouter.getParam('userId');
    const employed = false;

    return userId === Meteor.userId() && dbEmployees.findOne({userId, employed});
  },
  isBaned(type) {
    return _.contains(this.profile.ban, type);
  },
  isInVacation() {
    return this.profile.isInVacation;
  },
  isEndingVacation() {
    return this.profile.isEndingVacation;
  }
});

export const companyTitleView = new ReactiveVar('chairman');
Template.companyTitleTab.helpers({
  getClass(type) {
    if (companyTitleView.get() === type) {
      return 'nav-link active';
    }
    else {
      return 'nav-link';
    }
  }
});
Template.companyTitleTab.events({
  'click [data-type]'(event) {
    event.preventDefault();
    const $target = $(event.currentTarget);
    companyTitleView.set($target.data('type'));
  }
});

Template.accountCompanyTitle.helpers({
  viewType(type) {
    return (companyTitleView.get() === type);
  }
});

export const chairmanOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.chairmanTitleList);
Template.chairmanTitleList.onCreated(function() {
  chairmanOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountChairmanTitle', userId, chairmanOffset.get());
    }
  });
});
Template.chairmanTitleList.helpers({
  titleList() {
    return dbCompanies
      .find({
        chairman: this._id
      },
      {
        limit: 10
      });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfChairmanTitle',
      dataNumberPerPage: 10,
      offset: chairmanOffset
    };
  }
});

export const managerOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.managerTitleList);
Template.managerTitleList.onCreated(function() {
  managerOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountManagerTitle', userId, managerOffset.get());
    }
  });
});
Template.managerTitleList.helpers({
  titleList() {
    return dbCompanies
      .find({
        manager: this._id
      },
      {
        limit: 10
      });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfManagerTitle',
      dataNumberPerPage: 10,
      offset: managerOffset
    };
  }
});

Template.employeeTitleList.helpers({
  employment() {
    const userId = FlowRouter.getParam('userId');
    const employed = true;

    return dbEmployees.findOne({userId, employed});
  },
  nextSeasonEmployment() {
    const userId = FlowRouter.getParam('userId');
    const employed = false;

    return dbEmployees.findOne({userId, employed});
  }
});

export const taxesOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.accountInfoTaxList);
Template.accountInfoTaxList.onCreated(function() {
  taxesOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountInfoTax', userId, taxesOffset.get());
    }
  });
});
Template.accountInfoTaxList.helpers({
  ...accountInfoCommonHelpers,
  taxesList() {
    const userId = FlowRouter.getParam('userId');

    return dbTaxes.find({userId}, {
      limit: 10,
      sort: {
        expireDate: 1
      }
    });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfAccountInfoTax',
      dataNumberPerPage: 10,
      offset: taxesOffset
    };
  }
});

export const ownStocksOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.accountInfoOwnStockList);
Template.accountInfoOwnStockList.onCreated(function() {
  ownStocksOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountOwnStocks', userId, ownStocksOffset.get());
    }
  });
});
Template.accountInfoOwnStockList.helpers({
  directorList() {
    const userId = FlowRouter.getParam('userId');

    return dbDirectors.find({userId}, {
      limit: 10
    });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfAccountOwnStocks',
      dataNumberPerPage: 10,
      offset: ownStocksOffset
    };
  }
});


export const accountLogViewerMode = new ReactiveVar('accuse');
Template.accountLogViewer.helpers({
  onlyViewAccuse() {
    return accountLogViewerMode.get() === 'accuse';
  }
});

export const accuseOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.accountAccuseLogList);
Template.accountAccuseLogList.onCreated(function() {
  accuseOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountAccuseLog', userId, accuseOffset.get());
    }
  });
});
Template.accountAccuseLogList.helpers({
  accuseList() {
    const userId = FlowRouter.getParam('userId');

    return dbLog.find(
      {
        userId: userId,
        logType: {
          $in: accuseLogTypeList
        }
      },
      {
        sort: {
          createdAt: -1
        },
        limit: 10
      }
    );
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfAccountAccuseLog',
      dataNumberPerPage: 10,
      offset: accuseOffset
    };
  }
});
Template.accountAccuseLogList.events({
  'click button'(event) {
    event.preventDefault();
    accountLogViewerMode.set('all');
  }
});

export const logOffset = new ReactiveVar(0);
inheritedShowLoadingOnSubscribing(Template.accountInfoLogList);
Template.accountInfoLogList.onCreated(function() {
  logOffset.set(0);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = FlowRouter.getParam('userId');
    if (userId) {
      this.subscribe('accountInfoLog', userId, logOffset.get());
    }
  });
});
Template.accountInfoLogList.helpers({
  logList() {
    const userId = FlowRouter.getParam('userId');

    return dbLog.find(
      {
        userId: {
          $in: [userId, '!all']
        },
        logType: {
          $ne: '聊天發言'
        }
      },
      {
        sort: {
          createdAt: -1
        },
        limit: 30
      }
    );
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfAccountInfoLog',
      dataNumberPerPage: 30,
      offset: logOffset
    };
  }
});
Template.accountInfoLogList.events({
  'click button'(event) {
    event.preventDefault();
    accountLogViewerMode.set('accuse');
  }
});
