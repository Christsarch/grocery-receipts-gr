// Ιστορικό: λίστα με όλες τις αποδείξεις, νεότερες πρώτα.
// Με κλικ σε μια απόδειξη ανοίγουν τα είδη της (μία ανοιχτή κάθε φορά).
import {
  formatCents,
  receiptTotalInCents,
  lineTotalInCents,
} from "../data/money.js";
import { CHAINS } from "../data/chains.js";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db.js";
import { useState } from "react";

// "1,037 κιλά" ή "2 τεμ."
function formatQuantity(item) {
  const num = item.quantity.toLocaleString("el-GR");
  const unitLabel = item.unit === "kg" ? "κιλά" : "τεμ.";
  return `${num} ${unitLabel}`;
}

export default function History() {
  // Ποια απόδειξη είναι ανοιχτή (null: καμία)
  const [openId, setOpenId] = useState(null);

  // Εναλλαγή: αν είναι ήδη ανοιχτή κλείνει, αλλιώς ανοίγει (και κλείνει όποια ήταν ανοιχτή)
  function toggleReceipt(id) {
    setOpenId(openId === id ? null : id);
  }

  const receipts = useLiveQuery(() =>
    db.receipts.orderBy("date").reverse().toArray(),
  );

  async function deleteReceipt(e, id) {
    // Το κλικ σταματάει εδώ: αλλιώς θα "ανέβαινε" στην κάρτα και θα την άνοιγε/έκλεινε
    e.stopPropagation();
    if (!confirm("Διαγραφή αυτής της απόδειξης;")) {
      return;
    }
    await db.receipts.delete(id);
  }

  if (receipts === undefined) {
    return (
      <section className="page">
        <h2>Ιστορικό</h2>
        <div className="card empty">
          <p>Φόρτωση…</p>
        </div>
      </section>
    );
  }

  if (receipts.length === 0) {
    return (
      <section className="page">
        <h2>Ιστορικό</h2>
        <div className="card empty">
          <p>Δεν έχεις αποθηκεύσει αποδείξεις ακόμα.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <h2>Ιστορικό</h2>
      <div className="receipt-list">
        {receipts.map((receipt) => (
          <div
            className="card receipt-card"
            key={receipt.id}
            onClick={() => toggleReceipt(receipt.id)}
          >
            <div className="receipt-head">
              <span>
                {/* Δεν σπάει αν η αλυσίδα δεν υπάρχει πια (π.χ. παλιά απόδειξη) */}
                {CHAINS.find((chain) => chain.id === receipt.chainId)?.name ??
                  "Άγνωστη αλυσίδα"}
              </span>
              <span>{formatCents(receiptTotalInCents(receipt))}</span>
            </div>
            <div className="receipt-meta">
              <span>{receipt.date.split("-").reverse().join("/")}</span>
              <span>{receipt.items.length} είδη</span>
              <button
                type="button"
                onClick={(e) => deleteReceipt(e, receipt.id)}
              >
                X
              </button>
            </div>
            {openId === receipt.id && (
              <ul className="receipt-items">
                {receipt.items.map((item, index) => (
                  <li key={item.id ?? index}>
                    <span>{item.name}</span>
                    <span className="muted">{formatQuantity(item)}</span>
                    <span>{formatCents(lineTotalInCents(item))}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
