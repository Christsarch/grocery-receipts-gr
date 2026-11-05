import Dexie from "dexie";

export const db = new Dexie("grocery-receipts");

db.version(1).stores({
  receipts: "id, date, chainId",
});