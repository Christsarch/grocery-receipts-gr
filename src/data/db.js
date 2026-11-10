import Dexie from "dexie";

export const db = new Dexie("grocery-receipts");

db.version(1).stores({
  receipts: "id, date, chainId",
});

// Έκδοση 2: ευρετήριο στον ΜΑΡΚ, για τον έλεγχο διπλοεγγραφής
db.version(2).stores({ receipts: "id, date, chainId, mark" });

// Έκδοση 3: οι κατηγορίες που διόρθωσε ο χρήστης (κανονικοποιημένο όνομα είδους → κατηγορία)
db.version(3).stores({
  receipts: "id, date, chainId, mark",
  categoryOverrides: "name",
});