import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { dbLog, accuseLogTypeList } from '/db/dbLog';
import { limitSubscription } from '/server/imports/utils/rateLimit';
import { debug } from '/server/imports/utils/debug';
import { publishTotalCount } from '/server/imports/utils/publishTotalCount';

Meteor.publish('accountAccuseLog', function(userId, offset) {
  debug.log('publish accountAccuseLog', { userId, offset });
  check(userId, String);
  check(offset, Match.Integer);

  const filter = {
    userId,
    logType: { $in: accuseLogTypeList }
  };

  publishTotalCount('totalCountOfAccountAccuseLog', dbLog.find(filter), this);

  const pageObserver = dbLog
    .find(filter, {
      sort: { createdAt: -1 },
      skip: offset,
      limit: 10,
      disableOplog: true
    })
    .observeChanges({
      added: (id, fields) => {
        this.added('log', id, fields);
      },
      removed: (id) => {
        this.removed('log', id);
      }
    });

  if (this.userId === userId) {
    Meteor.users.update({
      _id: userId
    }, {
      $set: { 'profile.lastReadAccuseLogDate': new Date() }
    });
  }

  this.ready();
  this.onStop(() => {
    pageObserver.stop();
  });
});
// 一分鐘最多20次
limitSubscription('accountInfoLog');
