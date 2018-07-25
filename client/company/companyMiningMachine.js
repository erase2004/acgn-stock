import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { wrapFunction } from 'meteor/teamgrid:reactive-interval';

import { gradeFactorTable } from '/db/dbCompanies';
import { dbCompanyStones, stonePowerTable, stoneTypeList } from '/db/dbCompanyStones';
import { getCurrentSeason } from '/db/dbSeason';
import { wrapScopeKey } from '/common/imports/utils/wrapScopeKey';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { paramCompany, paramCompanyId } from './helpers';

inheritedShowLoadingOnSubscribing(Template.companyMiningMachine);

const lastRoundEndTime = new Date(Meteor.settings.public.lastRoundEndTime);

const reactiveTimeToSeasonEnd = wrapFunction(() => {
  return getCurrentSeason().endDate.getTime() - lastRoundEndTime.getTime();
}, 1000);

Template.companyMiningMachine.onCreated(function() {
  this.companyStonesOffset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    this.subscribe('companyMiningMachineInfo', paramCompanyId());
  });

  this.autorunWithIdleSupport(() => {
    this.subscribe('companyStones', {
      companyId: paramCompanyId(),
      offset: this.companyStonesOffset.get()
    });
  });

  this.autorunWithIdleSupport(() => {
    if (Meteor.userId()) {
      this.subscribe('companyCurrentUserPlacedStones', paramCompanyId());
    }
  });
});

Template.companyMiningMachine.helpers({
  isInOperationTime() {
    return reactiveTimeToSeasonEnd() < Meteor.settings.public.miningMachineOperationTime;
  },
  stoneTypeList() {
    return stoneTypeList;
  },
  stoneCount(stoneType) {
    const { miningMachineInfo } = paramCompany();

    if (! miningMachineInfo || ! miningMachineInfo.stoneCount) {
      return 0;
    }

    return miningMachineInfo.stoneCount[stoneType] || 0;
  },
  stonePower(stoneType) {
    return stonePowerTable[stoneType];
  },
  totalMiningPower() {
    const { miningMachineInfo } = paramCompany();

    if (! miningMachineInfo || ! miningMachineInfo.stoneCount) {
      return 0;
    }

    return Object.entries(miningMachineInfo.stoneCount).reduce((sum, [stoneType, count]) => {
      return sum + (stonePowerTable[stoneType] || 0) * count;
    }, 0);
  },
  totalMiningProfit(totalPower) {
    const { grade } = paramCompany();
    const gradeFactor = gradeFactorTable.miningMachine[grade];

    return Math.round(6300 * Math.log10(totalPower + 1) * Math.pow(totalPower + 1, gradeFactor));
  },
  currentUserPlacedStoneType() {
    const companyId = paramCompanyId();
    const userId = Meteor.userId();
    const { stoneType } = dbCompanyStones.findOne({ companyId, userId }) || {};

    return stoneType;
  },
  companyStones() {
    return dbCompanyStones.find({ [wrapScopeKey('companyStones')]: 1 }, { sort: { placedAt: -1 } });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfCompanyStones',
      dataNumberPerPage: Meteor.settings.public.dataNumberPerPage.companyStones,
      offset: Template.instance().companyStonesOffset
    };
  }
});

