import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { dbCompanyStones, stoneTypeList, stonePowerTable } from '/db/dbCompanyStones';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { accountInfoCommonHelpers, paramUserId, paramUser } from './helpers';

inheritedShowLoadingOnSubscribing(Template.accountInfoStonePanel);

Template.accountInfoStonePanel.onCreated(function() {
  this.placedStonesOffset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    const userId = paramUserId();
    if (userId) {
      const offset = this.placedStonesOffset.get();
      this.subscribe('userPlacedStones', { userId, offset });
    }
  });
});

Template.accountInfoStonePanel.helpers({
  ...accountInfoCommonHelpers,
  placedStones() {
    return dbCompanyStones.find({ userId: paramUserId() });
  },
  stoneTypeList() {
    return stoneTypeList;
  },
  stonePower(stoneType) {
    return stonePowerTable[stoneType];
  },
  userStoneCount(stoneType) {
    return paramUser().profile.stones[stoneType] || 0;
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfUserPlacedStones',
      dataNumberPerPage: Meteor.settings.public.dataNumberPerPage.userPlacedStones,
      offset: Template.instance().placedStonesOffset
    };
  }
});

