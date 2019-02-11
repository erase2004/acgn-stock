import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { dbArena } from '/db/dbArena';

const lastRoundEndTime = new Date(Meteor.settings.public.lastRoundEndTime);

export function paramArenaId() {
  return FlowRouter.getParam('arenaId');
}

export function paramArena() {
  const arenaId = paramArenaId();

  return arenaId ? dbArena.findOne(arenaId) : null;
}

export function isArenaEnded() {
  const arena = paramArena();

  return arena && arena.endDate && arena.endDate.getTime() < lastRoundEndTime.getTime();
}

export function isArenaJoinEnded() {
  const arena = paramArena();

  return arena && arena.joinEndDate && arena.joinEndDate.getTime() < lastRoundEndTime.getTime();
}
