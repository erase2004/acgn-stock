import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { dbResourceLock } from '/db/dbResourceLock';

import { addTask, resolveTask } from '../layout/loading';
import { alertDialog } from '../layout/alertDialog';
import { handleError } from './handleError';

/*
 * 在原本的 Meteor.call 外，包裝自訂的載入狀態與錯誤處理顯示
 *
 * 為了不影響到其他使用到 Meteor.call 的部分 (e.g., 3rd-party packages)，不直接覆蓋掉 Meteor.call，
 * client 端要處理 error 時需直接使用此 function 替代 Meteor.call。
 */
Meteor.customCall = function(...args) {
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
};

