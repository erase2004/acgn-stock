
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { reactiveInterval } from 'meteor/teamgrid:reactive-interval';

import { paramAnnouncement, computeThreshold } from './helpers';

const lastRoundEndTime = new Date(Meteor.settings.public.lastRoundEndTime);

function isRejectionPetitionOverdue({ dueAt }) {
  return lastRoundEndTime.getTime() > dueAt.getTime();
}

Template.announcementRejectionPetition.helpers({
  petition() {
    return paramAnnouncement().rejectionPetition;
  },
  signerCount() {
    return paramAnnouncement().rejectionPetition.signers.length;
  },
  threshold() {
    return computeThreshold(paramAnnouncement().rejectionPetition);
  },
  isPassed() {
    return !! paramAnnouncement().rejectionPetition.passedAt;
  },
  isOverdue() {
    return isRejectionPetitionOverdue(paramAnnouncement().rejectionPetition);
  },
  remainingTime() {
    reactiveInterval(500);

    const { dueAt } = paramAnnouncement().rejectionPetition;

    return Math.max(dueAt.getTime() - lastRoundEndTime.getTime(), 0);
  }
});

