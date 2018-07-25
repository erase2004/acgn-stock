import { FlowRouter } from 'meteor/kadira:flow-router';

import { dbViolationCases, categoryDisplayName, stateDisplayName } from '/db/dbViolationCases';

export function paramViolationCaseId() {
  return FlowRouter.getParam('violationCaseId');
}

export function paramViolationCase() {
  const violationCaseId = paramViolationCaseId();

  return violationCaseId ? dbViolationCases.findOne(violationCaseId) : null;
}

export function stateBadgeClass(state) {
  switch (state) {
    case 'pending':
      return 'badge-default';
    case 'processing':
      return 'badge-info';
    case 'rejected':
      return 'badge-danger';
    case 'closed':
      return 'badge-warning';
    default:
      return 'badge-default';
  }
}

export function pathForViolationCaseDetail(violationCaseId) {
  return FlowRouter.path('violationCaseDetail', { violationCaseId });
}

export const commonHelpers = {
  categoryDisplayName,
  stateDisplayName,
  pathForViolationCaseDetail,
  stateBadgeClass
};
