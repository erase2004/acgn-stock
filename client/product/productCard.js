import { Template } from 'meteor/templating';

Template.productCard.helpers({
  soldAmount() {
    const { product } = Template.currentData();
    const { totalAmount, stockAmount, availableAmount } = product;

    return totalAmount - stockAmount - availableAmount;
  }
});
