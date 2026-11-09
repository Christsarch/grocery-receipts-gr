// Διαβάζει το αρχείο "myData (detailed)" που δίνουν οι πάροχοι (π.χ. Epsilon Digital για τον ΑΒ).
// Σχήμα της ΑΑΔΕ, κοινό για όλους τους παρόχους. Τρέχει στον browser, χωρίς Worker.
// Επιστρέφει το ίδιο σχήμα με τον Worker: { chainId, afm, mark, date, items }
// Πετάει λάθος με μήνυμα για τον χρήστη αν το αρχείο δεν είναι το σωστό.

// Κωδικοί measurementUnit της ΑΑΔΕ (πίνακας 8.13) → οι δικές μας μονάδες
const UNITS = { 1: "piece", 2: "kg" };

// Ίδιος πίνακας με τον Worker (θα τον ενώσουμε αργότερα)
const CHAIN_BY_AFM = { "094063140": "masoutis", "094025817": "ab" };

// Από κείμενο σε ευρώ ("1.13") σε ακέραια λεπτά (113)
function toCents(text) {
  return Math.round(Number(text) * 100);
}

// Το κείμενο του πρώτου στοιχείου που ταιριάζει στο selector μέσα στο parent, ή null αν δεν υπάρχει
function textOf(parent, selector) {
  return parent.querySelector(selector)?.textContent ?? null;
}

export function parseMyData(xmlText) {
  // Ο DOMParser δεν πετάει λάθος σε χαλασμένο XML: βάζει ένα <parsererror> στο έγγραφο
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror") !== null) {
    throw new Error("Το αρχείο δεν είναι έγκυρο XML");
  }

  const invoice = doc.querySelector("invoice");
  if (invoice === null) {
    throw new Error("Δεν είναι αρχείο myDATA");
  }

  // "issuer > vatNumber": ο ΑΦΜ του εκδότη (της αλυσίδας), όχι κάποιου άλλου <vatNumber>
  const afm = textOf(invoice, "issuer > vatNumber");
  const mark = textOf(invoice, "mark");
  const date = textOf(invoice, "issueDate");

  const items = [];
  let totalInCents = 0;
  for (const line of invoice.querySelectorAll("invoiceDetails")) {
    // Το απλό αρχείο έχει μόνο σύνολα ανά ΦΠΑ, χωρίς περιγραφή είδους
    const name = textOf(line, "itemDescr");
    if (name === null) {
      throw new Error(
        "Αυτό είναι το απλό αρχείο myData. Κατέβασε το «myData (detailed)»",
      );
    }

    // Ποσότητα και μονάδα
    const quantity = Number(textOf(line, "quantity"));
    const code = textOf(line, "measurementUnit");
    const unit = UNITS[code];
    if (unit === undefined) {
      throw new Error(`Άγνωστος κωδικός μονάδας: ${code}`);
    }

    // Σύνολο γραμμής = καθαρή αξία + ΦΠΑ (οι εκπτώσεις έχουν ήδη αφαιρεθεί)
    const netInCents = toCents(textOf(line, "netValue"));
    const vatInCents = toCents(textOf(line, "vatAmount"));
    const lineTotalInCents = netInCents + vatInCents;
    totalInCents += lineTotalInCents;

    const unitPriceInCents = Math.round(lineTotalInCents / quantity);
    items.push({ name, unit, quantity, lineTotalInCents, unitPriceInCents });
  }

  // Έλεγχος: τα είδη πρέπει να αθροίζουν ακριβώς στο σύνολο της απόδειξης
  const grossInCents = toCents(textOf(invoice, "totalGrossValue"));
  if (totalInCents !== grossInCents) {
    throw new Error(
      `Τα είδη αθροίζουν ${totalInCents} λεπτά, αλλά το σύνολο είναι ${grossInCents}`,
    );
  }

  return { chainId: CHAIN_BY_AFM[afm] ?? null, afm, mark, date, items };
}
