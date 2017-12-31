import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { dbCompanyStones, stoneTypeList } from '/db/dbCompanyStones';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { accountInfoCommonHelpers } from './helpers';

inheritedShowLoadingOnSubscribing(Template.accountInfoStonePanel);

Template.accountInfoStonePanel.onCreated(function() {
  this.placedStonesOffset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    const userId = FlowRouter.getParam('userId');

    if (userId) {
      const offset = this.placedStonesOffset.get();
      this.subscribe('userPlacedStones', { userId, offset });
    }
  });
});

Template.accountInfoStonePanel.helpers({
  ...accountInfoCommonHelpers,
  placedStones() {
    const { user: { _id: userId } } = Template.instance().data;

    return dbCompanyStones.find({ userId });
  },
  stoneTypeList() {
    return stoneTypeList;
  },
  buyableStoneTypeList() {
    return Object.keys(Meteor.settings.public.stonePrice);
  },
  stonePrice(stoneType) {
    return Meteor.settings.public.stonePrice[stoneType];
  },
  userStoneCount(stoneType) {
    const { user } = Template.instance().data;

    return user.profile.stones[stoneType] || 0;
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfUserPlacedStones',
      dataNumberPerPage: Meteor.settings.public.dataNumberPerPage.userPlacedStones,
      offset: Template.instance().placedStonesOffset
    };
  }
});
