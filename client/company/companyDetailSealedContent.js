import { Template } from 'meteor/templating';

import { paramCompany } from './helpers';

Template.companyDetailSealedContent.helpers({
  company() {
    return paramCompany();
  }
});
