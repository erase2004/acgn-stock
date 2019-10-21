'use strict';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { handleError } from '../utils/handleError';
import { addTask, resolveTask } from '../layout/loading';
import { alertDialog } from '../layout/alertDialog';
import { shouldStopSubscribe } from '../utils/idle';

export const rAccountDialogMode = new ReactiveVar(false);
const rUserName = new ReactiveVar('');
Template.accountDialog.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
  });
});
Template.accountDialog.events({
  reset() {
    rUserName.set('');
    rAccountDialogMode.set(false);
  },
  submit(event, templateInstance) {
    event.preventDefault();
    const dialogMode = rAccountDialogMode.get();
    const username = templateInstance.$('#loginUserName').val();
    if (! username) {
      window.alert('錯誤的帳號格式！');

      return false;
    }
    rUserName.set(username);

    const type = dialogMode.replace('login', '');
    tryLogin(username, type);
  }
});

const utilHelpers = {
  displayByDialogMode() {
    switch (rAccountDialogMode.get()) {
      case 'loginPTT': {
        return 'accountDialogBodyLoginPTT';
      }
      case 'loginBahamut': {
        return 'accountDialogBodyLoginBahamut';
      }
      case 'loginGoogle': {
        return 'accountDialogBodyLoginGoogle';
      }
    }
  }
};
Template.accountDialog.helpers(utilHelpers);
Template.accountDialogBodyLoginPTT.helpers(utilHelpers);
Template.accountDialogBodyLoginBahamut.helpers(utilHelpers);
Template.accountDialogBodyLoginGoogle.helpers(utilHelpers);

function reportError(error, callback) {
  if (callback) {
    callback(error);
  }
  else {
    throw error;
  }
}

Meteor.hybridLogin = function(selector, type, callback) {
  if (typeof selector === 'string')
    selector = { username: selector };

  Accounts.callLoginMethod({
    methodArguments: [
      {
        user: selector,
        type: type
      }
    ],
    userCallback: function(error) {
      if (error) {
        reportError(error, callback);
      }
      else if (callback) {
        callback();
      }
    }
  });
};

function tryLogin(username, type) {
  addTask();
  Meteor.hybridLogin(username, type, (error) => {
    resolveTask();
    if (error) {
      if (error.message === 'User not found [403]') {
        alertDialog.alert({
          message: '使用者不存在'
        });
      }
      else {
        handleError(error);
      }
    }
  });
}
