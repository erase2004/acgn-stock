import { Template } from 'meteor/templating';


Template.companyOrderDisplay.helpers({
  orderTypeDisplayName() {
    return Template.currentData().orderType;
  },
  unfilledAmount() {
    const { amount: totalAmount, done: filledAmount } = Template.currentData();

    return totalAmount - filledAmount;
  }
});

