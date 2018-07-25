
import { Template } from 'meteor/templating';

import { dbVariables } from '/db/dbVariables';
import { rMainTheme } from '../utils/styles';
import { shouldStopSubscribe } from '../utils/idle';

Template.footer.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    this.subscribe('onlinePeopleNumber');
  });
});

Template.footer.helpers({
  onlinePeopleNumber() {
    return dbVariables.get('onlinePeopleNumber') || 0;
  },
  containerClass() {
    if (rMainTheme.get() === 'light') {
      return 'container container-light';
    }

    return 'container container-dark';
  }
});

