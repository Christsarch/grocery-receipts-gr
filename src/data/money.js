export function lineTotalInCents(item) {
  return Math.round(item.quantity * item.unitPriceInCents);
}

export function receiptTotalInCents(receipt) {
  let totalPrice = 0;

  for (const item of receipt.items) {
    totalPrice += lineTotalInCents(item);
  }

  return totalPrice;
}
