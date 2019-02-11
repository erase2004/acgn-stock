import { Template } from 'meteor/templating';
import { productReplenishBatchSizeTypeDisplayName, productReplenishBaseAmountTypeDisplayName } from '/db/dbProducts';

Template.productCard.helpers({
  soldAmount() {
    const { product } = Template.currentData();
    const { totalAmount, stockAmount, availableAmount } = product;

    return totalAmount - stockAmount - availableAmount;
  },
  replenishPolicyDescription() {
    const { product } = Template.currentData();
    const baseAmountType = productReplenishBaseAmountTypeDisplayName(product.replenishBaseAmountType);
    const batchSizeType = productReplenishBatchSizeTypeDisplayName(product.replenishBatchSizeType);

    return `依${baseAmountType}補${batchSizeType}`;
  }
});
