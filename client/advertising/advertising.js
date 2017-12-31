'use strict';
import { dbAdvertising } from '/db/dbAdvertising';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { formatDateText } from '../utils/helpers';
import { shouldStopSubscribe } from '../utils/idle';

inheritedShowLoadingOnSubscribing(Template.advertising);
const rInBuyAdvertisingMode = new ReactiveVar(false);
Template.advertising.onCreated(function() {
  rInBuyAdvertisingMode.set(false);
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
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

    return formatDateText(expireTime);
  }
});
