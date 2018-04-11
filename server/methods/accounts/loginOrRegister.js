
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { limitMethod } from '/server/imports/utils/rateLimit';
import { debug } from '/server/imports/utils/debug';

Meteor.methods({
  loginOrRegister({ username, password, type, reset }) {
    debug.log('loginOrRegister', { username, password, type, reset });
    check(username, String);
    check(password, String);
    check(type, new Match.OneOf('PTT', 'Bahamut'));
    check(reset, Boolean);

    const checkUsername = (type === 'Bahamut') ? `?${username}` : username;

    if (Meteor.users.find({ username: checkUsername }).count() > 0 && ! reset) {
      return true;
    }
    else {
      return false;
    }
  }
});
// 一分鐘最多五次
limitMethod('loginOrRegister', 5);

