// Υπολογισμοί για τη σελίδα Στατιστικά: ομαδοποίηση εξόδων και άθροιση (όλα σε λεπτά).
import { receiptTotalInCents, lineTotalInCents } from "./money.js";
import { CHAINS } from "./chains.js";
import { categorize } from "./categories.js";

// Έξοδα ανά μήνα, από τον παλαιότερο στον νεότερο: [{ month: "2026-11", total: 2842 }, ...]
export function totalsByMonth(receipts) {
  const totals = {};
  for (const receipt of receipts) {
    const month = receipt.date.slice(0, 7);
    totals[month] = (totals[month] ?? 0) + receiptTotalInCents(receipt);
  }
  return Object.entries(totals)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

// Έξοδα ανά αλυσίδα, από τη μεγαλύτερη: [{ name: "Μασούτης", total: 2431 }, ...]
export function totalsByChain(receipts) {
  const totals = {};
  for (const receipt of receipts) {
    const name =
      CHAINS.find((chain) => chain.id === receipt.chainId)?.name ??
      "Άγνωστη αλυσίδα";
    totals[name] = (totals[name] ?? 0) + receiptTotalInCents(receipt);
  }
  return Object.entries(totals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

// Έξοδα ανά κατηγορία, από τη μεγαλύτερη: [{ name: "Γαλακτοκομικά & αυγά", total: 1520 }, ...]
// Εδώ ομαδοποιούμε ΕΙΔΗ, όχι αποδείξεις: μια απόδειξη έχει είδη από πολλές κατηγορίες.
export function totalsByCategory(receipts, overrides) {
  const totals = {};
  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const name = categorize(item.name, overrides).name;
      totals[name] = (totals[name] ?? 0) + lineTotalInCents(item);
    }
  }
  return Object.entries(totals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}
