// Νέα απόδειξη.
// Φάση 1: φόρμα για χειροκίνητη καταχώριση (κατάστημα, ημερομηνία, είδη, τιμές).
// Φάση 2: φωτογραφία + ανάγνωση QR.
// Φάση 3: OCR που συμπληρώνει τη φόρμα αυτόματα.

import { useState } from "react";
import { CHAINS } from "../data/chains.js";
import {
  parseDecimal,
  lineTotalInCents,
  receiptTotalInCents,
  formatCents,
} from "../data/money.js";
import { db } from "../data/db.js";

function fromItemToItem(formItem) {
  const quantity = parseDecimal(formItem.quantityText);
  const price = parseDecimal(formItem.priceText);
  if (quantity === null || price === null) {
    return null;
  }
  const unitPriceInCents = Math.round(price * 100);
  return {
    unit: formItem.unit,
    quantity: quantity,
    unitPriceInCents: unitPriceInCents,
    name: formItem.name,
    id: formItem.id,
  };
}
function newEmptyItem() {
  return {
    id: crypto.randomUUID(),
    name: "",
    unit: "piece",
    quantityText: "1",
    priceText: "",
  };
}

export default function NewReceipt() {
  const [chainId, setChainId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([newEmptyItem()]);
  const [photoUrl, setPhotoUrl] = useState("");

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoUrl(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (!confirm("Αφαίρεση αυτής της φωτογραφίας;")) {
      return;
    }
    URL.revokeObjectURL(photoUrl);
    setPhotoUrl("");
  }

  function addItem() {
    setItems([...items, newEmptyItem()]);
  }

  function removeItem(id) {
    setItems(items.filter((f) => f.id !== id));
  }

  function updateItem(id, field, value) {
    // για κάθε είδος: αν είναι αυτό με το id, αντίγραφο με το field αλλαγμένο, αλλιώς όπως είνα
    setItems(items.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  }

  const readyItems = items
    .map((item) => fromItemToItem(item))
    .filter((f) => f !== null);

  const totalInCents = receiptTotalInCents({ items: readyItems });

  async function saveReceipt() {
    if (chainId === "" || readyItems.length === 0) {
      alert("Πρέπει να γίνει επιλογή αλυσίδας και καταχώρηση προϊόντος");
      return;
    }
    const receipt = {
      id: crypto.randomUUID(),
      chainId: chainId,
      date: date,
      items: readyItems,
    };
    await db.receipts.add(receipt);

    setChainId("");
    setItems([newEmptyItem()]);
  }

  return (
    <section className="page">
      <h2>Νέα απόδειξη</h2>
      <label className="photo-button">
        📷 Φωτογραφία απόδειξης
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handlePhoto}
        />
      </label>
      {photoUrl && (
        <div>
          <img
            src={photoUrl}
            alt="Φωτογραφία απόδειξης"
            className="photo-preview"
          />
          <button type="button" onClick={removePhoto}>
            Αφαίρεση φωτογραφίας
          </button>
        </div>
      )}
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
      {items.map((item) => {
        const converted = fromItemToItem(item);
        const lineText =
          converted === null ? "-" : formatCents(lineTotalInCents(converted));
        return (
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
            <small>{lineText}</small>
          </div>
        );
      })}
      <button type="button" onClick={() => addItem()}>
        Προσθήκη
      </button>
      <p>
        <strong>Σύνολο: {formatCents(totalInCents)}</strong>
      </p>
      <button type="button" className="primary" onClick={saveReceipt}>
        Αποθήκευση
      </button>
    </section>
  );
}
