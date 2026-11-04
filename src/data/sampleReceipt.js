export const sampleReceipt = {
  id: crypto.randomUUID(),
  chainId: "masoutis",
  date: "2026-11-04T14:30:15",
  items: [
    { id: crypto.randomUUID(), name: "ΓΑΛΑ ΝΟΥΝΟΥ 1L", unit: "piece", quantity: 2,     unitPriceInCents: 150 },
    { id: crypto.randomUUID(), name: "ΜΗΛΑ",           unit: "kg",    quantity: 1.234, unitPriceInCents: 189 },
    { id: crypto.randomUUID(), name: "ΑΥΓΑ 6ΤΕΜ",      unit: "piece", quantity: 1,     unitPriceInCents: 245 },
  ],
};