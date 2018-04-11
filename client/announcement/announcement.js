'use strict';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { dbRound } from '/db/dbRound';
import { dbSeason } from '/db/dbSeason';
import { dbVariables } from '/db/dbVariables';
import { inheritedShowLoadingOnSubscribing } from '../layout/loading';
import { formatDateText, formatTimeText, currencyFormat } from '../utils/helpers';
import { shouldStopSubscribe } from '../utils/idle';

inheritedShowLoadingOnSubscribing(Template.announcement);
Template.announcement.onCreated(function() {
  this.autorun(() => {
    if (shouldStopSubscribe()) {
      return false;
    }
    this.subscribe('announcementDetail');
    this.subscribe('currentRound');
    this.subscribe('currentSeason');
  });
});
Template.announcement.helpers({
  getTutorialHref() {
    return FlowRouter.path('tutorial');
  },
  announcementDetail() {
    return dbVariables.get('announcementDetail');
  }
});

const nowTime = new Date(Meteor.settings.public.lastRoundEndTime);

function aboutToEnd(end, hour) {
  const threshold = 1000 * 60 * 60 * hour;

  if (end) {
    const rest = new Date(end).getTime() - nowTime.getTime();

    return ((rest >= 0) && (rest <= threshold));
  }
  else {
    return false;
  }
}

Template.systemStatusPanel.helpers({
  roundStartTime() {
    const currentRound = dbRound.findOne({}, {
      sort: {
        beginDate: -1
      }
    });

    return currentRound ? formatDateText(currentRound.beginDate) : '????/??/?? ??:??:??';
  },
  roundEndTime() {
    const currentRound = dbRound.findOne({}, {
      sort: {
        beginDate: -1
      }
    });

    return currentRound ? formatDateText(currentRound.endDate) : '????/??/?? ??:??:??';
  },
  seasonStartTime() {
    const currentSeason = dbSeason.findOne({}, {
      sort: {
        beginDate: -1
      }
    });

    return currentSeason ? formatDateText(currentSeason.beginDate) : '????/??/?? ??:??:??';
  },
  seasonEndTime() {
    const currentSeason = dbSeason.findOne({}, {
      sort: {
        beginDate: -1
      }
    });

    return currentSeason ? formatDateText(currentSeason.endDate) : '????/??/?? ??:??:??';
  },
  stockPriceUpdateBegin() {
    const time = dbVariables.get('recordListPriceBegin');

    return formatDateText(time ? new Date(time) : null);
  },
  stockPriceUpdateEnd() {
    const time = dbVariables.get('recordListPriceEnd');

    return formatDateText(time ? new Date(time) : null);
  },
  highPriceReleaseBegin() {
    const time = dbVariables.get('releaseStocksForHighPriceBegin');

    return formatDateText(time ? new Date(time) : null);
  },
  highPriceReleaseEnd() {
    const time = dbVariables.get('releaseStocksForHighPriceEnd');

    return formatDateText(time ? new Date(time) : null);
  },
  noDealReleaseBegin() {
    const time = dbVariables.get('releaseStocksForNoDealBegin');

    return formatDateText(time ? new Date(time) : null);
  },
  noDealReleaseEnd() {
    const time = dbVariables.get('releaseStocksForNoDealEnd');

    return formatDateText(time ? new Date(time) : null);
  },
  updateSalaryDeadline() {
    const seasonData = dbSeason
      .findOne({}, {
        sort: {
          beginDate: -1
        }
      });

    return formatDateText(seasonData ? new Date(seasonData.endDate.getTime() - Meteor.settings.public.announceSalaryTime) : null);
  },
  updateProfitDistributionDeadline() {
    const seasonData = dbSeason.findOne({}, { sort: { beginDate: -1 } });

    return formatDateText(seasonData ? new Date(seasonData.endDate.getTime() - Meteor.settings.public.companyProfitDistribution.lockTime) : null);
  },
  highPriceThreshold() {
    return currencyFormat(dbVariables.get('highPriceThreshold'));
  },
  lowPriceThreshold() {
    return currencyFormat(dbVariables.get('lowPriceThreshold'));
  },
  taskIsReady(begin, end) {
    const now = nowTime.getTime();

    if (begin && end) {
      begin = new Date(begin).getTime();
      end = new Date(end).getTime();

      return (now >= begin && now <= end) ? 'text-danger' : '';
    }
  },
  taskLeftInfo(end, hour) {
    const rest = (new Date(end).getTime() - nowTime.getTime());

    return aboutToEnd(end, hour) ? '(' + formatTimeText(rest) + ')' : '';
  },
  taskIsAboutToEnd(end, hour) {
    return aboutToEnd(end, hour) ? 'text-danger' : '';
  }
});
