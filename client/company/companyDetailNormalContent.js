import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { isHeadlessChrome } from '/client/utils/isHeadlessChrome';
import { paramCompany, paramCompanyId } from './helpers';

const TAGS_LIMIT = 3;

Template.companyDetailNormalContent.onCreated(function() {
  this.showAllTags = new ReactiveVar(isHeadlessChrome());
  this.autorunWithIdleSupport(() => {
    const companyId = paramCompanyId();
    if (companyId) {
      this.subscribe('employeeListByCompany', companyId);
    }
  });
});

Template.companyDetailNormalContent.helpers({
  company() {
    return paramCompany();
  },
  visibleTags() {
    const { tags } = paramCompany();

    if (! tags) {
      return [];
    }

    return Template.instance().showAllTags.get() ? tags : tags.slice(0, TAGS_LIMIT);
  },
  showAllTags() {
    const { tags } = paramCompany();

    if (! tags) {
      return false;
    }

    return tags.length <= TAGS_LIMIT || Template.instance().showAllTags.get();
  }
});

Template.companyDetailNormalContent.events({
  'click [data-action="showAllTags"]'(event, templateInstance) {
    event.preventDefault();
    templateInstance.showAllTags.set(true);
  }
});
