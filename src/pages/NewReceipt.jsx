// Νέα απόδειξη.
// Φάση 1: φόρμα για χειροκίνητη καταχώριση (κατάστημα, ημερομηνία, είδη, τιμές).
// Φάση 2: φωτογραφία + ανάγνωση QR.
// Φάση 3: OCR που συμπληρώνει τη φόρμα αυτόματα.

import { useState } from "react";
import { CHAINS } from "../data/chains.js";

export default function NewReceipt() {
  const [chainId, setChainId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([
    {
      id: crypto.randomUUID(),
      name: "",
      unit: "piece",
      quantityText: "1",
      priceText: "",
    },
  ]);

  function addItem() {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        name: "",
        unit: "piece",
        quantityText: "1",
        priceText: "",
      },
    ]);
  }

  function removeItem(id) {
    setItems(items.filter((f) => f.id !== id));
  }

  function updateItem(id, field, value) {
    // για κάθε είδος: αν είναι αυτό με το id, αντίγραφο με το field αλλαγμένο, αλλιώς όπως είνα
    setItems(items.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  }

  return (
    <section className="page">
      <h2>Νέα απόδειξη</h2>
      <div className="field">
        <label>Αλυσίδα</label>
        <select value={chainId} onChange={(e) => setChainId(e.target.value)}>
          <option value="">Διάλεξε αλυσίδα</option>
          {CHAINS.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Ημερομηνία</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <h3>Είδη</h3>
      {items.map((item) => (
        <div className="item-row" key={item.id}>
          <input
            placeholder="Όνομα"
            value={item.name}
            onChange={(e) => updateItem(item.id, "name", e.target.value)}
          />
          <button type="button" onClick={() => removeItem(item.id)}>
            X
          </button>
          <select
            value={item.unit}
            onChange={(e) => updateItem(item.id, "unit", e.target.value)}
          >
            <option value="piece">τεμ.</option>
            <option value="kg">κιλά</option>
          </select>
          <input
            placeholder="Ποσότητα"
            value={item.quantityText}
            onChange={(e) =>
              updateItem(item.id, "quantityText", e.target.value)
            }
          />
          <input
            placeholder="Τιμή"
            value={item.priceText}
            onChange={(e) => updateItem(item.id, "priceText", e.target.value)}
          />
        </div>
      ))}
      <button type="button" onClick={() => addItem()}>
        Προσθήκη
      </button>
      <pre>{JSON.stringify(items, null, 2)}</pre>
      <div className="card">
        <p className="muted">Εδώ θα μπει η φόρμα καταχώρισης (Φάση 1).</p>
      </div>
    </section>
  );
}
