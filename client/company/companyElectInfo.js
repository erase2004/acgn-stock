import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

import { paramCompany } from './helpers';

Template.companyElectInfo.onCreated(function() {
  this.selectedCandidateInfo = new ReactiveVar(null);
});

Template.companyElectInfo.helpers({
  company() {
    return paramCompany();
  },
  inElect() {
    const candidateList = this.candidateList;

    return candidateList && candidateList.length > 1;
  },
  getSupportPercentage(candidateIndex) {
    const { supportStocksList, totalRelease } = paramCompany();
    const supportStocks = supportStocksList ? supportStocksList[candidateIndex] : 0;

    return Math.round(supportStocks / totalRelease * 10000) / 100;
  },
  hasSupporters(candidateIndex) {
    return ! _.isEmpty(paramCompany().voteList[candidateIndex]);
  },
  showSupportListDialog() {
    return !! Template.instance().selectedCandidateInfo.get();
  },
  supporterListDialogArgs() {
    const templateInstance = Template.instance();
    const { candidateId, voteList } = templateInstance.selectedCandidateInfo.get();

    return {
      candidateId,
      voteList,
      onDismiss: () => {
        templateInstance.selectedCandidateInfo.set(null);
      }
    };
  }
});

Template.companyElectInfo.events({
  'click [data-show-supporter]'(event, templateInstance) {
    event.preventDefault();
    const { candidateList, voteList } = paramCompany();
    const candidateIndex = parseInt($(event.currentTarget).attr('data-show-supporter'), 10);

    templateInstance.selectedCandidateInfo.set({
      candidateId: candidateList[candidateIndex],
      voteList: voteList[candidateIndex]
    });
  }
});
