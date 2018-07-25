import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { dbTaxes } from '/db/dbTaxes';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { accountInfoCommonHelpers, paramUserId } from './helpers';

inheritedShowLoadingOnSubscribing(Template.accountInfoTaxList);

Template.accountInfoTaxList.onCreated(function() {
  this.taxListOffset = new ReactiveVar(0);

  this.autorunWithIdleSupport(() => {
    const userId = paramUserId();

    if (userId) {
      const offset = this.taxListOffset.get();
      this.subscribe('accountInfoTax', userId, offset);
    }
  });
});
Template.accountInfoTaxList.helpers({
  ...accountInfoCommonHelpers,
  taxesList() {
    const userId = paramUserId();

    return dbTaxes.find({ userId }, {
      limit: 10,
      sort: {
        expireDate: 1
      }
    });
  },
  paginationData() {
    return {
      useVariableForTotalCount: 'totalCountOfAccountInfoTax',
      dataNumberPerPage: 10,
      offset: Template.instance().taxListOffset
    };
  }
});

