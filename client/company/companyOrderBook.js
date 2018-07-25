import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { inheritedShowLoadingOnSubscribing } from '/client/layout/loading';
import { wrapScopeKey } from '/common/imports/utils/wrapScopeKey';
import { dbOrders, orderTypeTranslateMap } from '/db/dbOrders';
import { paramCompany, paramCompanyId } from './helpers';

inheritedShowLoadingOnSubscribing(Template.companyOrderBook);

Template.companyOrderBook.onCreated(function() {
  this.autorunWithIdleSupport(() => {
    if (Meteor.user()) {
      this.subscribe('currentUserOrders');
      this.subscribe('currentUserDirectors');
    }
  });

  this.getCurrentUserOrders = (type) => {
    return dbOrders.find({
      companyId: paramCompanyId(),
      orderType: orderTypeTranslateMap[type],
      [wrapScopeKey('currentUser')]: 1
    });
  };
});

Template.companyOrderBook.helpers({
  company() {
    return paramCompany();
  },
  currentUserOrders(type) {
    return Template.instance().getCurrentUserOrders(type);
  },
  hasCurrentUserOrders(type) {
    return Template.instance().getCurrentUserOrders(type).count() > 0;
  }
});

