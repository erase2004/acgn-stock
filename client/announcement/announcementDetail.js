import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { categoryDisplayName } from '/db/dbAnnouncements';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { paramAnnouncementId, paramAnnouncement } from './helpers';

inheritedShowLoadingOnSubscribing(Template.announcementDetail);

Template.announcementDetail.onCreated(function() {
  this.autorunWithIdleSupport(() => {
    const announcementId = paramAnnouncementId();

    if (! announcementId) {
      return;
    }

    this.subscribe('announcementDetail', announcementId);
  });
});

Template.announcementDetail.helpers({
  categoryDisplayName,
  announcement() {
    return paramAnnouncement();
  },
  canRejectAnnoumcenet() {
    return !! paramAnnouncement().hasRejectionPetition;
  },
  pathForRejectAnnouncement() {
    return FlowRouter.path('rejectAnnouncement', { announcementId: paramAnnouncementId() });
  }
});
