import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { wrapFunction } from 'meteor/teamgrid:reactive-interval';

import { dbCompanies } from '/db/dbCompanies';
import { dbCompanyStones, stonePowerTable, stoneTypeList } from '/db/dbCompanyStones';
import { getCurrentSeason } from '/db/dbSeason';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';

inheritedShowLoadingOnSubscribing(Template.companyMiningMachine);

const reactiveTimeToSeasonEnd = wrapFunction(() => {
  return getCurrentSeason().endDate.getTime() - new Date(Meteor.settings.public.lastRoundEndTime);
}, 1000);

Template.companyMiningMachine.onCreated(function() {
  const companyId = FlowRouter.getParam('companyId');

  this.autorunWithIdleSupport(() => {
    if (companyId) {
      this.subscribe('companyMiningMachineInfo', companyId);
    }
  });

  this.autorunWithIdleSupport(() => {
    if (Meteor.userId()) {
      this.subscribe('companyCurrentUserPlacedStones', companyId);
    }
  });
});

Template.companyMiningMachine.helpers({
  isInOperationTime() {
    return (reactiveTimeToSeasonEnd() < Meteor.settings.public.miningMachineOperationTime) && (reactiveTimeToSeasonEnd >= 0);
  },
  stoneTypeList() {
    return stoneTypeList;
  },
  stoneCount(stoneType) {
    const companyId = FlowRouter.getParam('companyId');
    const { miningMachineInfo } = dbCompanies.findOne(companyId);

    if (! miningMachineInfo || ! miningMachineInfo.stoneCount) {
      return 0;
    }

    return miningMachineInfo.stoneCount[stoneType] || 0;
  },
  totalMiningPower() {
    const companyId = FlowRouter.getParam('companyId');
    const { miningMachineInfo } = dbCompanies.findOne(companyId);

    if (! miningMachineInfo || ! miningMachineInfo.stoneCount) {
      return 0;
    }

    return Object.entries(miningMachineInfo.stoneCount).reduce((sum, [stoneType, count]) => {
      return sum + (stonePowerTable[stoneType] || 0) * count;
    }, 0);
  },
  currentUserPlacedStoneType() {
    const companyId = FlowRouter.getParam('companyId');
    const userId = Meteor.userId();
    const { stoneType } = dbCompanyStones.findOne({ companyId, userId }) || {};

    return stoneType;
  },
  currentUserAvailableStoneTypeList() {
    const user = Meteor.user();
    if (! user) {
      return [];
    }

    return Object.entries(user.profile.stones)
      .filter(([key, value]) => {
        return stoneTypeList.includes(key) && value > 0;
      })
      .map(([key]) => {
        return key;
      });
  }
});
