'use strict';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { Meteor } from 'meteor/meteor';
import { DocHead } from 'meteor/kadira:dochead';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { dbCompanies } from '/db/dbCompanies';
import { dbEmployees } from '/db/dbEmployees';
import { dbVips } from '/db/dbVips';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { shouldStopSubscribe } from '../utils/idle';
import { accountInfoCommonHelpers, paramUserId, paramUser } from './helpers';

inheritedShowLoadingOnSubscribing(Template.accountInfo);

Template.accountInfo.onCreated(function() {
  this.autorunWithIdleSupport(() => {
    const userId = paramUserId();
    if (userId) {
      this.subscribe('accountInfo', userId);
    }
  });

  this.autorunWithIdleSupport(() => {
    const userId = paramUserId();
    if (userId) {
      this.subscribe('employeeListByUser', userId);
    }
  });

  this.autorun(() => {
    const user = paramUser();
    if (user) {
      DocHead.setTitle(Meteor.settings.public.websiteName + ' - 「' + user.profile.name + '」帳號資訊');
    }
  });
});
// 是否展開面板
const rDisplayPanelList = new ReactiveVar([]);
Template.accountInfo.helpers({
  ...accountInfoCommonHelpers,
  isDisplayPanel(panelType) {
    return _.contains(rDisplayPanelList.get(), panelType);
  }
});
Template.accountInfo.events({
  'click [data-toggle-panel]'(event) {
    event.preventDefault();
    const panelType = $(event.currentTarget).attr('data-toggle-panel');
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
  isBaned(type) {
    return _.contains(this.profile.ban, type);
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
    const userId = paramUserId();
    if (userId) {
      this.subscribe('accountChairmanTitle', userId, chairmanOffset.get());
    }
  });
});
Template.chairmanTitleList.helpers({
  ...accountInfoCommonHelpers,
  titleList() {
    return dbCompanies
      .find({
        chairman: this._id,
        isSeal: false
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
    const userId = paramUserId();
    if (userId) {
      this.subscribe('accountManagerTitle', userId, managerOffset.get());
    }
  });
});
Template.managerTitleList.helpers({
  titleList() {
    return dbCompanies
      .find({
        manager: this._id,
        isSeal: false
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

Template.employeeTitleList.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    const userId = paramUserId();
    if (userId) {
      this.subscribe('accounEmployeeTitle', userId);
    }
  });
});
Template.employeeTitleList.helpers({
  employment() {
    const userId = paramUserId();

    return dbEmployees.find({ userId }, { sort: { employed: -1 } });
  },
  isSeal(companyId) {
    const companyData = dbCompanies.findOne(companyId);

    return companyData ? companyData.isSeal : false;
  }
});

Template.vipTitleList.onCreated(function() {
  this.offset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    const userId = paramUserId();
    if (userId) {
      this.subscribe('accountVipTitle', userId, this.offset.get());
    }
  });
});
Template.vipTitleList.helpers({
  vips() {
    return dbVips.find({ userId: paramUserId }, { sort: { level: -1 } });
  },
  getTitle(vip) {
    return `Level ${vip.level} VIP`;
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfVipTitle',
      dataNumberPerPage: 10,
      offset: Template.instance().offset
    };
  }
});
