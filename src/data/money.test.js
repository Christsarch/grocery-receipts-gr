// Τεστ για τα ποσά. Τρέχουν με: npm test
import { describe, it, expect } from "vitest";
import {
  lineTotalInCents,
  receiptTotalInCents,
  receiptsTotalInCents,
  formatCents,
  parseDecimal,
} from "./money.js";

describe("lineTotalInCents", () => {
  it("ποσότητα × τιμή μονάδας, για χειροκίνητα είδη", () => {
    expect(lineTotalInCents({ quantity: 2, unitPriceInCents: 130 })).toBe(260);
  });

  it("στρογγυλοποιεί σε ακέραια λεπτά (κιλά)", () => {
    // 1,037 κιλά × 1,09 €/κιλό = 1,13033 € → 113 λεπτά
    expect(lineTotalInCents({ quantity: 1.037, unitPriceInCents: 109 })).toBe(113);
  });

  it("προτιμά το ακριβές σύνολο της απόδειξης, όταν υπάρχει", () => {
    // 3 τεμάχια σε προσφορά 1 €: 3 × 0,33 θα έδινε 99, η απόδειξη λέει 100
    expect(
      lineTotalInCents({ quantity: 3, unitPriceInCents: 33, lineTotalInCents: 100 }),
    ).toBe(100);
  });
});

describe("σύνολα αποδείξεων", () => {
  const receipt = {
    items: [
      { quantity: 1, unitPriceInCents: 399 },
      { quantity: 2, unitPriceInCents: 130 },
    ],
  };

  it("το σύνολο μιας απόδειξης είναι το άθροισμα των γραμμών", () => {
    expect(receiptTotalInCents(receipt)).toBe(659);
  });

  it("το σύνολο πολλών αποδείξεων", () => {
    expect(receiptsTotalInCents([receipt, receipt])).toBe(1318);
  });

  it("καμία απόδειξη: 0", () => {
    expect(receiptsTotalInCents([])).toBe(0);
  });
});

describe("formatCents", () => {
  it("λεπτά σε ευρώ, με ελληνική μορφή", () => {
    // Το Intl βάζει ένα ειδικό κενό (U+00A0) πριν από το €, γι' αυτό συγκρίνουμε χωρίς κενά
    expect(formatCents(2069).replace(/\s/g, "")).toBe("20,69€");
  });
});

describe("parseDecimal", () => {
  it("δέχεται κόμμα και τελεία", () => {
    expect(parseDecimal("1,09")).toBe(1.09);
    expect(parseDecimal("1.09")).toBe(1.09);
  });

  it("κενό ή λάθος κείμενο: null", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("abc")).toBeNull();
  });
});
