import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { reactiveInterval } from 'meteor/teamgrid:reactive-interval';

import { paramAnnouncement, computeThreshold } from './helpers';

const lastRoundEndTime = new Date(Meteor.settings.public.lastRoundEndTime);

Template.announcementRejectionPoll.helpers({
  poll() {
    return paramAnnouncement().rejectionPoll;
  },
  threshold() {
    return computeThreshold(paramAnnouncement().rejectionPoll);
  },
  isFinished() {
    const { voided, rejectionPoll } = paramAnnouncement();

    return voided || lastRoundEndTime.getTime() > rejectionPoll.dueAt;
  },
  isVoided() {
    return paramAnnouncement().voided;
  },
  choiceMatches(choice) {
    const { currentUserChoice } = paramAnnouncement().rejectionPoll;

    return currentUserChoice === choice;
  },
  voteCount(choice) {
    const { yesVotes, noVotes } = paramAnnouncement().rejectionPoll;

    return choice === 'yes' ? yesVotes.length : choice === 'no' ? noVotes.length : 0;
  },
  totalVoteCount() {
    const { yesVotes, noVotes } = paramAnnouncement().rejectionPoll;

    return yesVotes.length + noVotes.length;
  },
  isThresholdPassed() {
    const threshold = computeThreshold(paramAnnouncement().rejectionPoll);
    const { yesVotes, noVotes } = paramAnnouncement().rejectionPoll;
    const totalVoteCount = yesVotes.length + noVotes.length;

    return totalVoteCount >= threshold;
  },
  showVoteLists() {
    const { yesVotes, noVotes, dueAt } = paramAnnouncement().rejectionPoll;
    const isOverdue = lastRoundEndTime.getTime() > dueAt.getTime();

    return isOverdue && yesVotes && noVotes;
  },
  remainingTime() {
    reactiveInterval(500);

    const { dueAt } = paramAnnouncement().rejectionPoll;

    return Math.max(dueAt.getTime() - lastRoundEndTime.getTime(), 0);
  }
});
