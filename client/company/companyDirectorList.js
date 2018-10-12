import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';

import { dbDirectors } from '/db/dbDirectors';
import { inheritedShowLoadingOnSubscribing } from '/client/layout/loading';
import { paramCompany, paramCompanyId } from './helpers';

inheritedShowLoadingOnSubscribing(Template.companyDirectorList);

Template.companyDirectorList.onCreated(function() {
  this.offset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    const companyId = paramCompanyId();
    if (companyId) {
      this.subscribe('companyDirector', companyId, this.offset.get());
    }
  });
});

Template.companyDirectorList.helpers({
  company() {
    return paramCompany();
  },
  directorList() {
    const companyId = paramCompanyId();

    return dbDirectors.find({ companyId }, { sort: { stocks: -1, createdAt: 1 } });
  },
  getPercentage(stocks) {
    return Math.round(stocks / paramCompany().totalRelease * 10000) / 100;
  },
  getMessage(message) {
    return message || '無';
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfCompanyDirector',
      dataNumberPerPage: 10,
      offset: Template.instance().offset
    };
  },
  getCurrentUserDirectorMessage() {
    const userId = Meteor.userId();
    const companyId = paramCompanyId();

    return dbDirectors.findOne({ companyId, userId }).message;
  },
  isDirectorInVacation(userId) {
    const user = Meteor.users.findOne(userId);

    return user ? user.profile.isInVacation : false;
  }
});

