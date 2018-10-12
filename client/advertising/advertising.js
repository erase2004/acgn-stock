import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { dbAdvertising } from '/db/dbAdvertising';
import { formatDateTimeText } from '/common/imports/utils/formatTimeUtils';

import { inheritedShowLoadingOnSubscribing } from '../layout/loading';

inheritedShowLoadingOnSubscribing(Template.advertising);
Template.advertising.onCreated(function() {
  this.autorunWithIdleSupport(() => {
    this.subscribe('allAdvertising');
  });
});
Template.advertising.helpers({
  advertisingList() {
    return dbAdvertising.find({}, {
      sort: {
        paid: -1
      }
    });
  },
  advertisingDisplayClass(advertisingDisplayIndex) {
    if (advertisingDisplayIndex < Meteor.settings.public.displayAdvertisingNumber) {
      return 'table-success';
    }
  },
  formatExpireDate(advertisingData) {
    const createdAtTime = advertisingData.createdAt.getTime();
    const expireTime = new Date(createdAtTime + Meteor.settings.public.advertisingExpireTime);

    return formatDateTimeText(expireTime);
  }
});
