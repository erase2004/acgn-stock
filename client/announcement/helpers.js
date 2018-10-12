import { FlowRouter } from 'meteor/kadira:flow-router';

import { dbAnnouncements } from '/db/dbAnnouncements';

export function paramAnnouncementId() {
  return FlowRouter.getParam('announcementId');
}

export function paramAnnouncement() {
  const announcementId = paramAnnouncementId();

  return announcementId ? dbAnnouncements.findOne(announcementId) : null;
}

export function computeThreshold({ thresholdPercent, activeUserCount }) {
  return Math.ceil(activeUserCount * thresholdPercent / 100);
}

