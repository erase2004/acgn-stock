import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { categoryDisplayName, stateDisplayName, violatorTypeDisplayName } from '/db/dbViolationCases';
import { dbLog } from '/db/dbLog';
import { dbViolationCaseActionLogs, actionDisplayName } from '/db/dbViolationCaseActionLogs';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { paramViolationCase, paramViolationCaseId, stateBadgeClass, pathForViolationCaseDetail } from './helpers';

inheritedShowLoadingOnSubscribing(Template.violationCaseDetail);

Template.violationCaseDetail.onCreated(function() {
  this.associatedLogOffset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    const violationCaseId = paramViolationCaseId();

    if (! violationCaseId) {
      return;
    }

    this.subscribe('violationCaseDetail', violationCaseId);
  });

  this.autorunWithIdleSupport(() => {
    const violationCaseId = paramViolationCaseId();

    if (! violationCaseId) {
      return;
    }

    const offset = this.associatedLogOffset.get();

    this.subscribe('violationCaseAssociatedLogs', { violationCaseId, offset });
  });
});

Template.violationCaseDetail.helpers({
  categoryDisplayName,
  violatorTypeDisplayName,
  actionDisplayName,
  stateDisplayName,
  stateBadgeClass,
  pathForViolationCaseDetail,
  violationCase() {
    return paramViolationCase();
  },
  actionLogs() {
    return dbViolationCaseActionLogs.find({ violationCaseId: paramViolationCaseId() }, { sort: { executedAt: 1 } });
  },
  associatedLogs() {
    return dbLog.find({ 'data.violationCaseId': paramViolationCaseId() }, { sort: { created: -1 } });
  },
  associatedLogsPaginationData() {
    return {
      counterName: 'violationCaseAssociatedLogs',
      dataNumberPerPage: Meteor.settings.public.dataNumberPerPage.violationCaseAssociatedLogs,
      offset: Template.instance().associatedLogOffset
    };
  }
});

