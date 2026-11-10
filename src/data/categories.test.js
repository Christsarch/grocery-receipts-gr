// Τεστ για τις κατηγορίες. Τρέχουν με: npm test
import { describe, it, expect } from "vitest";
import { normalizeName, categorize } from "./categories.js";

describe("normalizeName", () => {
  it("κεφαλαία χωρίς τόνους", () => {
    expect(normalizeName("γιαούρτι")).toBe("ΓΙΑΟΥΡΤΙ");
  });
});

describe("categorize", () => {
  it("βρίσκει λέξη κλειδί μέσα στο όνομα", () => {
    expect(categorize("ΓΙΑΟΥΡΤΙ ΣΤΡΑΓΓΙΣΤΟ 2%").id).toBe("dairy");
  });

  it("η σειρά των κατηγοριών μετράει", () => {
    // Έχει και "ΓΑΛΑ", αλλά τα Γλυκά ελέγχονται πριν από τα Γαλακτοκομικά
    expect(categorize("σοκολάτα γάλακτος").id).toBe("sweets");
  });

  it("άγνωστο προϊόν: Άλλα", () => {
    expect(categorize("ΣΑΚΟΥΛΑ ΤΑΜΕΙΟΥ").id).toBe("other");
  });

  it("η διόρθωση του χρήστη κερδίζει τους κανόνες", () => {
    // Το όνομα με μικρά, η διόρθωση με κεφαλαία: ελέγχει και την κανονικοποίηση
    const overrides = { "ΣΑΚΟΥΛΑ ΤΑΜΕΙΟΥ": "household" };
    expect(categorize("σακούλα ταμείου", overrides).id).toBe("household");
  });
});
