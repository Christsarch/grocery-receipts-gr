// Αντίγραφο ασφαλείας: όλα τα δεδομένα της εφαρμογής σε ένα αρχείο JSON, και επαναφορά τους.
// Τα δεδομένα ζουν ΜΟΝΟ στη συσκευή (IndexedDB): χωρίς αντίγραφο, αν καθαριστεί ο browser, χάνονται.
import { db } from "./db.js";

// Ένα "υπογεγραμμένο" όνομα: έτσι αναγνωρίζουμε ότι ένα αρχείο είναι δικό μας αντίγραφο
const APP_ID = "grocery-receipts-gr";

// Όλα τα δεδομένα σε ένα αντικείμενο
export async function exportBackup() {
  const receipts = await db.receipts.toArray();
  const categoryOverrides = await db.categoryOverrides.toArray();
  return {
    app: APP_ID,
    version: 1,
    exportedAt: new Date().toISOString(),
    receipts,
    categoryOverrides,
  };
}

// Κατεβάζει ένα αντικείμενο ως αρχείο JSON (στο κινητό: στις Λήψεις). Έτοιμη.
export function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Επαναφορά από το κείμενο ενός αρχείου αντιγράφου. Επιστρέφει πόσες αποδείξεις προστέθηκαν.
// Δεν σβήνει τίποτα: προσθέτει ό,τι λείπει, και παραλείπει όσες αποδείξεις υπάρχουν ήδη.
export async function importBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Το αρχείο δεν είναι αντίγραφο ασφαλείας της εφαρμογής");
  }

  // Λάθος αρχείο (π.χ. ένα myDATA): σταματάμε ΠΡΙΝ γράψουμε οτιδήποτε στη βάση
  if (data.app !== APP_ID || !Array.isArray(data.receipts)) {
    throw new Error("Το αρχείο δεν είναι αντίγραφο ασφαλείας της εφαρμογής");
  }

  // Όσες αποδείξεις υπάρχουν ήδη: ίδιο id, ή ίδιος ΜΑΡΚ (η ίδια απόδειξη, σκαναρισμένη σε άλλη συσκευή)
  const existing = await db.receipts.toArray();
  const existingIds = new Set(existing.map((r) => r.id));
  // Χωρίς τα null: οι χειροκίνητες αποδείξεις δεν έχουν ΜΑΡΚ
  const existingMarks = new Set(existing.map((r) => r.mark).filter((m) => m));

  // Κρατάμε μόνο όσες ΔΕΝ υπάρχουν: ούτε με το ίδιο id, ούτε με τον ίδιο ΜΑΡΚ
  const newReceipts = data.receipts.filter(
    (r) => !existingIds.has(r.id) && !(r.mark && existingMarks.has(r.mark)),
  );

  // Όλα μαζί ή τίποτα: αν κάτι αποτύχει στη μέση, η βάση μένει όπως ήταν
  await db.transaction("rw", db.receipts, db.categoryOverrides, async () => {
    await db.receipts.bulkAdd(newReceipts);
    await db.categoryOverrides.bulkPut(data.categoryOverrides ?? []);
  });
  return newReceipts.length;
}
