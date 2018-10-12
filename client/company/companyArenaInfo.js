import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { getCurrentArena } from '/db/dbArena';
import { dbArenaFighters, getAttributeNumber, getTotalInvestedAmount } from '/db/dbArenaFighters';
import { inheritedShowLoadingOnSubscribing } from '/client/layout/loading';
import { paramCompany, paramCompanyId } from './helpers';

inheritedShowLoadingOnSubscribing(Template.companyArenaInfo);
Template.companyArenaInfo.onCreated(function() {
  this.autorunWithIdleSupport(() => {
    const companyId = paramCompanyId();
    if (companyId) {
      this.subscribe('companyArenaInfo', companyId);
    }
  });
});

Template.companyArenaInfo.helpers({
  pathForCurrentArena() {
    const { _id: arenaId } = getCurrentArena();

    return FlowRouter.path('arenaInfo', { arenaId });
  },
  currentArena() {
    const arenaData = getCurrentArena();

    if (arenaData) {
      arenaData.companyData = paramCompany();
      arenaData.joinData = dbArenaFighters.findOne({
        arenaId: arenaData._id,
        companyId: paramCompanyId()
      });

      return arenaData;
    }
    else {
      return false;
    }
  },
  getAttributeNumber(attribute, number) {
    return getAttributeNumber(attribute, number);
  },
  totalInvestedAmount() {
    return getTotalInvestedAmount(this);
  },
  arenaMinInvestedAmount() {
    return Meteor.settings.public.arenaMinInvestedAmount;
  },
  notEnoughInvestedAmount() {
    return getTotalInvestedAmount(this) < Meteor.settings.public.arenaMinInvestedAmount;
  }
});
