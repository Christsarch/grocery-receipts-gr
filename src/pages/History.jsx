// Ιστορικό: λίστα με όλες τις αποδείξεις, νεότερες πρώτα (Φάση 1).
import { formatCents, receiptTotalInCents } from "../data/money.js";
import { CHAINS } from "../data/chains.js";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db.js";

export default function History() {
  const receipts = useLiveQuery(() =>
    db.receipts.orderBy("date").reverse().toArray(),
  );

  async function deleteReceipt(id) {
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
          <div className="card" key={receipt.id}>
            <div className="receipt-head">
              <span>
                {CHAINS.find((chain) => chain.id === receipt.chainId).name}
              </span>
              <span>{formatCents(receiptTotalInCents(receipt))}</span>
            </div>
            <div className="receipt-meta">
              <span>{receipt.date.split("-").reverse().join("/")}</span>
              <span>{receipt.items.length} είδη</span>
              <button type="button" onClick={() => deleteReceipt(receipt.id)}>
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
