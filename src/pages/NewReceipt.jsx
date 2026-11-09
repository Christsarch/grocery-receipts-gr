// Νέα απόδειξη. Δύο τρόποι αυτόματης εισαγωγής, που καταλήγουν στην ίδια φόρμα:
// 1. Φωτογραφία με το QR → ο Worker φέρνει την ηλεκτρονική απόδειξη (π.χ. Μασούτης)
// 2. Αρχείο "myData (detailed)" που κατέβασε ο χρήστης από τον πάροχο (π.χ. ΑΒ)
// Η ίδια φόρμα χρησιμεύει για έλεγχο και διορθώσεις πριν την αποθήκευση,
// και για χειροκίνητη καταχώριση όταν η απόδειξη δεν μπορεί να εισαχθεί αυτόματα.

import { useState } from "react";
import { CHAINS } from "../data/chains.js";
import {
  parseDecimal,
  lineTotalInCents,
  receiptTotalInCents,
  formatCents,
} from "../data/money.js";
import { db } from "../data/db.js";
import { fileToCanvas } from "../image/resize.js";
import { readQr } from "../image/qr.js";
import { fetchReceipt } from "../data/receiptApi.js";
import { parseMyData } from "../data/mydata.js";

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
    lineTotalInCents: formItem.lineTotalInCents,
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

// Από ένα εισαγόμενο είδος (Worker ή myDATA) σε ένα είδος της φόρμας (το αντίστροφο της fromItemToItem)
function importedToFormItem(item) {
  return {
    id: crypto.randomUUID(),
    name: item.name,
    unit: item.unit,
    quantityText: String(item.quantity),
    priceText: (item.unitPriceInCents / 100).toFixed(2),
    lineTotalInCents: item.lineTotalInCents,
  };
}

export default function NewReceipt() {
  const [chainId, setChainId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  // Τα είδη ξεκινούν άδεια: γεμίζουν από την εισαγωγή, ή με το κουμπί "Προσθήκη είδους"
  const [items, setItems] = useState([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoInfo, setPhotoInfo] = useState("");
  const [qrText, setQrText] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [mark, setMark] = useState(null);

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    setPhotoUrl(URL.createObjectURL(file));
    // Καθαρίζουμε τα αποτελέσματα της προηγούμενης φωτογραφίας όσο ψάχνουμε
    setPhotoInfo("");
    setQrText("");
    setImportMessage("");
    setMark(null);

    const result = await fileToCanvas(file);
    setPhotoInfo(
      `${result.originalWidth}×${result.originalHeight} → ${result.canvas.width}×${result.canvas.height}`,
    );
    // Η αναζήτηση μπορεί να πάρει μερικά δευτερόλεπτα σε δύσκολες φωτογραφίες
    setImportMessage("Αναζήτηση QR…");
    // Χρησιμοποιούμε τη μεταβλητή qr και όχι το qrText: το state αλλάζει μόνο στο επόμενο render
    const qr = await readQr(result.canvas);
    setQrText(qr);
    setImportMessage("");
    if (qr !== null) {
      await importFromQr(qr);
    }
  }

  // Ο χρήστης διάλεξε αρχείο myDATA (detailed) που κατέβασε από τον πάροχο
  async function handleMyDataFile(e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    // Καθαρίζουμε φωτογραφία και μηνύματα από προηγούμενη εισαγωγή
    clearPhoto();
    try {
      const xmlText = await file.text();
      const receipt = parseMyData(xmlText);
      await fillFormFromReceipt(receipt);
    } catch (error) {
      // Το μήνυμα έρχεται από την parseMyData (π.χ. "Κατέβασε το «myData (detailed)»")
      setImportMessage(error.message);
    }
    // Αδειάζουμε την επιλογή, ώστε να μπορεί να ξαναδιαλεχτεί το ίδιο αρχείο
    e.target.value = "";
  }

  // Κοινό για QR και αρχείο myDATA: έλεγχος διπλοεγγραφής και γέμισμα της φόρμας
  // Τα λάθη τα πιάνει όποιος την καλεί (importFromQr, handleMyDataFile).
  async function fillFormFromReceipt(receipt) {
    // Έλεγχος διπλοεγγραφής: υπάρχει ήδη απόδειξη με τον ίδιο ΜΑΡΚ;
    if (receipt.mark !== null) {
      const existing = await db.receipts
        .where("mark")
        .equals(receipt.mark)
        .first();
      if (existing !== undefined) {
        setImportMessage("Αυτή η απόδειξη έχει ήδη αποθηκευτεί");
        return;
      }
    }
    setMark(receipt.mark);
    // Άγνωστος ΑΦΜ (chainId null): ο χρήστης διαλέγει αλυσίδα από τη λίστα
    if (receipt.chainId !== null) {
      setChainId(receipt.chainId);
    }
    setDate(receipt.date);
    setItems(receipt.items.map((item) => importedToFormItem(item)));
    setImportMessage(`Βρέθηκαν ${receipt.items.length} είδη`);
  }

  // Στέλνει τον σύνδεσμο του QR στον Worker και γεμίζει τη φόρμα με την απόδειξη
  async function importFromQr(qrUrl) {
    setImportMessage("Φόρτωση απόδειξης…");
    try {
      const receipt = await fetchReceipt(qrUrl);
      await fillFormFromReceipt(receipt);
    } catch (error) {
      // Το μήνυμα έρχεται από το fetchReceipt (π.χ. "Άγνωστος πάροχος")
      setImportMessage(error.message);
    }
  }

  function removePhoto() {
    if (!confirm("Αφαίρεση αυτής της φωτογραφίας;")) {
      return;
    }
    clearPhoto();
  }

  function clearPhoto() {
    URL.revokeObjectURL(photoUrl);
    setPhotoUrl("");
    setPhotoInfo("");
    setQrText("");
    setImportMessage("");
    setMark(null);
  }

  function addItem() {
    setItems([...items, newEmptyItem()]);
  }

  function removeItem(id) {
    setItems(items.filter((f) => f.id !== id));
  }

  function updateItem(id, field, value) {
    // Ποσότητα ή τιμή άλλαξε: το σύνολο της απόδειξης δεν ισχύει πια, θα υπολογιστεί από ποσότητα × τιμή
    const numbersChanged = field === "quantityText" || field === "priceText";

    if (numbersChanged) {
      setItems(
        items.map((f) =>
          f.id === id
            ? { ...f, [field]: value, lineTotalInCents: undefined }
            : f,
        ),
      );
    } else {
      setItems(items.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
    }
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
      mark: mark,
    };
    await db.receipts.add(receipt);

    // Η φόρμα και η φωτογραφία καθαρίζουν, έτοιμες για την επόμενη απόδειξη
    setChainId("");
    setItems([]);
    clearPhoto();
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
      <label className="photo-button">
        📄 Αρχείο myDATA
        <input type="file" accept=".xml" hidden onChange={handleMyDataFile} />
      </label>
      {photoUrl && (
        <div>
          <img
            src={photoUrl}
            alt="Φωτογραφία απόδειξης"
            className="photo-preview"
          />
          <small>{photoInfo}</small>
          {qrText === null && (
            <p className="muted">
              Δεν βρέθηκε QR. Δοκίμασε να φωτογραφίσεις από κοντά μόνο το QR, με
              καλό φωτισμό.
            </p>
          )}
          {qrText && (
            <p className="qr-link">
              QR:{" "}
              <a href={qrText} target="_blank" rel="noopener noreferrer">
                {qrText}
              </a>
            </p>
          )}
          <button type="button" onClick={removePhoto}>
            Αφαίρεση φωτογραφίας
          </button>
        </div>
      )}
      {/* Έξω από τη φωτογραφία: φαίνεται και στην εισαγωγή αρχείου myDATA */}
      {importMessage && <p className="muted status">{importMessage}</p>}
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
      {items.length === 0 && (
        <p className="muted">
          Φωτογράφισε την απόδειξη, διάλεξε αρχείο myDATA, ή πρόσθεσε τα είδη
          χειροκίνητα.
        </p>
      )}
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
      <button type="button" className="add-item" onClick={() => addItem()}>
        + Προσθήκη είδους
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
