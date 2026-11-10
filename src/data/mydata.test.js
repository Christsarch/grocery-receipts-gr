// @vitest-environment jsdom
// Το parseMyData χρειάζεται τον DOMParser του browser. Η γραμμή από πάνω λέει στο Vitest
// να τρέξει αυτό το αρχείο σε ψεύτικο browser (jsdom).
import { describe, it, expect } from "vitest";
import { parseMyData } from "./mydata.js";

// Μια ψεύτικη απόδειξη στη μορφή myDATA της ΑΑΔΕ. Όλα τα στοιχεία είναι επινοημένα.
function fakeMyData(lines, gross, { afm = "094025817", mark = "400000000000002" } = {}) {
  const details = lines
    .map(
      (l) => `
      <invoiceDetails>
        ${l.name ? `<itemDescr>${l.name}</itemDescr>` : ""}
        <quantity>${l.quantity}</quantity>
        <measurementUnit>${l.unit}</measurementUnit>
        <netValue>${l.net}</netValue>
        <vatAmount>${l.vat}</vatAmount>
      </invoiceDetails>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<InvoicesDoc xmlns="http://www.aade.gr/myDATA/invoice/v1.0">
  <invoice>
    <mark>${mark}</mark>
    <issuer><vatNumber>${afm}</vatNumber><country>GR</country></issuer>
    <invoiceHeader><issueDate>2026-01-15</issueDate></invoiceHeader>
    ${details}
    <invoiceSummary><totalGrossValue>${gross}</totalGrossValue></invoiceSummary>
  </invoice>
</InvoicesDoc>`;
}

const BUTTER = { name: "ΒΟΥΤΥΡΟ 250G", quantity: 1, unit: 1, net: "2.05", vat: "0.27" };
const APPLES = { name: "ΜΗΛΑ", quantity: 0.67, unit: 2, net: "1.18", vat: "0.15" };

describe("parseMyData", () => {
  it("διαβάζει αλυσίδα, ΑΦΜ, ΜΑΡΚ, ημερομηνία και είδη", () => {
    const receipt = parseMyData(fakeMyData([BUTTER, APPLES], "3.65"));
    expect(receipt.chainId).toBe("ab");
    expect(receipt.afm).toBe("094025817");
    expect(receipt.mark).toBe("400000000000002");
    expect(receipt.date).toBe("2026-01-15");
    expect(receipt.items).toEqual([
      { name: "ΒΟΥΤΥΡΟ 250G", unit: "piece", quantity: 1, lineTotalInCents: 232, unitPriceInCents: 232 },
      { name: "ΜΗΛΑ", unit: "kg", quantity: 0.67, lineTotalInCents: 133, unitPriceInCents: 199 },
    ]);
  });

  it("το απλό αρχείο (χωρίς περιγραφές ειδών): μήνυμα για το detailed", () => {
    const simple = fakeMyData([{ quantity: 1, unit: 1, net: "2.05", vat: "0.27" }], "2.32");
    expect(() => parseMyData(simple)).toThrow("myData (detailed)");
  });

  it("άγνωστη μονάδα: λάθος, αντί να γίνει σιωπηλά τεμάχιο", () => {
    const litres = { ...BUTTER, unit: 3 };
    expect(() => parseMyData(fakeMyData([litres], "2.32"))).toThrow("3");
  });

  it("τα είδη δεν αθροίζουν στο σύνολο: λάθος", () => {
    expect(() => parseMyData(fakeMyData([BUTTER], "9.99"))).toThrow("999");
  });

  it("χαλασμένο αρχείο: λάθος", () => {
    expect(() => parseMyData("<όχι xml")).toThrow("έγκυρο XML");
  });
});
