import { promisify } from 'util';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { resetDatabase } from 'meteor/xolvio:cleaner';
import expect from 'must';
import mustSinon from 'must-sinon';

import '/server/methods/accounts/loginOrRegister';

mustSinon(expect);

describe('method loginOrRegister', function() {
  this.timeout(10000);

  function loginOrRegister(params) {
    return promisify(Meteor.call)('loginOrRegister', params);
  }

  const userData = {
    username: 'someone',
    password: 'mypass',
    profile: {
      name: 'someone',
      validateType: 'PTT'
    }
  };

  beforeEach(function() {
    resetDatabase();
  });

  describe('when the user exists', function() {
    beforeEach(function() {
      Accounts.createUser(userData);
    });

    it('should return true', function() {
      return loginOrRegister({
        username: userData.username,
        password: userData.password,
        type: userData.profile.validateType,
        reset: false
      }).must.resolve.to.be.true();
    });
  });

  describe('when the user does not exist', function() {
    it('should return true', function() {
      return loginOrRegister({
        username: userData.username,
        password: userData.password,
        type: userData.profile.validateType,
        reset: false
      }).must.resolve.to.be.false();
    });
  });
});
