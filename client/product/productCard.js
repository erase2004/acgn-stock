import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

Template.productCard.helpers({
  isAdmin() {
    const user = Meteor.user();

    return user && user.profile.isAdmin;
  },
  soldAmount() {
    const { product } = Template.currentData();
    const { totalAmount, stockAmount, availableAmount } = product;

    return totalAmount - stockAmount - availableAmount;
  }
});

