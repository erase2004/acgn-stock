import { _ } from 'meteor/underscore';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';

const handleError = (msg, throwError = true) => {
  const error = new Meteor.Error(
    403,
    Accounts._options.ambiguousErrorMessages
      ? 'Something went wrong. Please check your credentials.'
      : msg
  );
  if (throwError) {
    throw error;
  }

  return error;
};

const NonEmptyString = Match.Where(function(x) {
  check(x, String);

  return x.length > 0;
});

const userQueryValidator = Match.Where(function(user) {
  check(user, {
    id: Match.Optional(NonEmptyString),
    username: Match.Optional(NonEmptyString)
  });
  if (_.keys(user).length !== 1)
    throw new Match.Error('User property must have exactly one field');

  return true;
});

Accounts._findUserByQuery = function(query) {
  let user = null;

  if (query.id) {
    user = Meteor.users.findOne({ _id: query.id });
  }
  else {
    let fieldName;
    let fieldValue;
    if (query.username) {
      fieldName = 'profile.name';
      fieldValue = query.username;
    }
    else {
      throw new Error('shouldn\'t happen (validation missed something)');
    }
    const selector = {};
    selector[fieldName] = fieldValue;
    user = Meteor.users.findOne(selector);
  }

  return user;
};

Accounts.registerLoginHandler('hybrid', function(options) {
  check(options, {
    user: userQueryValidator,
    type: new Match.OneOf('PTT', 'Bahamut', 'Google')
  });


  const user = Accounts._findUserByQuery(options.user, options.type);
  if (! user) {
    handleError('User not found');
  }

  return {
    userId: user._id
  };
});
