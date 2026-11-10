// Τεστ για τα στατιστικά. Τρέχουν με: npm test
import { describe, it, expect } from "vitest";
import { totalsByMonth, totalsByChain, totalsByCategory } from "./stats.js";

// Τρεις ψεύτικες αποδείξεις σε δύο μήνες. Τα σύνολα τα υπολογίζεις με το χέρι:
//   Μασούτης 06/11: ΓΑΛΑ 1,30 + ΜΗΛΑ 2,00 = 3,30 €
//   ΑΒ       07/11: ΓΙΑΟΥΡΤΙ 4,00         = 4,00 €
//   Μασούτης 20/10: ΨΩΜΙ 1,00             = 1,00 €
const receipts = [
  {
    chainId: "masoutis",
    date: "2026-11-06",
    items: [
      { name: "ΓΑΛΑ", quantity: 1, unitPriceInCents: 130 },
      { name: "ΜΗΛΑ", quantity: 1, unitPriceInCents: 200 },
    ],
  },
  {
    chainId: "ab",
    date: "2026-11-07",
    items: [{ name: "ΓΙΑΟΥΡΤΙ", quantity: 1, unitPriceInCents: 400 }],
  },
  {
    chainId: "masoutis",
    date: "2026-10-20",
    items: [{ name: "ΨΩΜΙ", quantity: 1, unitPriceInCents: 100 }],
  },
];

describe("totalsByMonth", () => {
  it("ανά μήνα, ο παλαιότερος πρώτος", () => {
    expect(totalsByMonth(receipts)).toEqual([
      { month: "2026-10", total: 100 },
      { month: "2026-11", total: 730 },
    ]);
  });
});

describe("totalsByChain", () => {
  it("ανά αλυσίδα, η μεγαλύτερη πρώτη", () => {
    expect(totalsByChain(receipts)).toEqual([
      { name: "Μασούτης", total: 430 },
      { name: "ΑΒ Βασιλόπουλος", total: 400 },
    ]);
  });
});

describe("totalsByCategory", () => {
  it("ανά κατηγορία, η μεγαλύτερη πρώτη", () => {
    expect(totalsByCategory(receipts, {})).toEqual([
      { name: "Γαλακτοκομικά & αυγά", total: 530 },
      { name: "Φρούτα & λαχανικά", total: 200 },
      { name: "Ψωμί & αρτοποιία", total: 100 },
    ]);
  });
});

describe("όλες οι ομαδοποιήσεις", () => {
  it("αθροίζουν στο ίδιο σύνολο (κανένα λεπτό δεν χάνεται ή δεν μετράει διπλά)", () => {
    const sum = (rows) => rows.reduce((total, row) => total + row.total, 0);
    const all = sum(totalsByMonth(receipts));
    expect(sum(totalsByChain(receipts))).toBe(all);
    expect(sum(totalsByCategory(receipts, {}))).toBe(all);
  });
});
