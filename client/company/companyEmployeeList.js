import { Template } from 'meteor/templating';

import { dbEmployees } from '/db/dbEmployees';
import { inheritedShowLoadingOnSubscribing } from '/client/layout/loading';
import { paramCompanyId } from '/client/company/helpers';

inheritedShowLoadingOnSubscribing(Template.companyEmployeeList);

Template.companyEmployeeList.helpers({
  employeeList() {
    const companyId = paramCompanyId();
    const employed = true;

    return dbEmployees.find({ companyId, employed }, { sort: { registerAt: 1 } });
  },
  nextSeasonEmployeeList() {
    const companyId = paramCompanyId();
    const employed = false;

    return dbEmployees.find({ companyId, employed }, { sort: { registerAt: 1 } });
  },
  showMessage(message) {
    return message || '無';
  }
});

