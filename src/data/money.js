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

export function parseDecimal(text) {
  const cleaned = text.trim().replace(",", ".");
  const number = Number(cleaned);
  return cleaned === "" || Number.isNaN(number) ? null : number;
}

export function formatCents(cents) {
  return (cents / 100).toLocaleString("el-GR", {
    style: "currency",
    currency: "EUR",
  });
}

export function receiptsTotalInCents(receipts) {
  let totalReceipts = 0;

  for (const receipt of receipts) {
    totalReceipts += receiptTotalInCents(receipt);
  }

  return totalReceipts;
}
