'use strict';
import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';

import { dbResourceLock } from '/db/dbResourceLock';
import { addTask, resolveTask } from '../layout/loading';
import { alertDialog } from '../layout/alertDialog';
import { handleError } from './handleError';

Meteor.subscribe('isChangingSeason');

function customCall(...args) {
  if (! Meteor.status().connected) {
    return false;
  }
  if (dbResourceLock.find('season').count()) {
    alertDialog.alert('伺服器正在忙碌中，請稍等一下吧！[503]');

    return false;
  }
  addTask();
  const lastArg = _.last(args);
  if (typeof lastArg === 'function') {
    args[args.length - 1] = function(error, result) {
      if (error) {
        handleError(error);
      }
      resolveTask();
      lastArg(error, result);
    };
  }
  else {
    args.push(function(error) {
      if (error) {
        handleError(error);
      }
      resolveTask();
    });
  }

  Meteor.call(...args);
}
Meteor.customCall = customCall;
