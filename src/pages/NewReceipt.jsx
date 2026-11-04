// Νέα απόδειξη.
// Φάση 1: φόρμα για χειροκίνητη καταχώριση (κατάστημα, ημερομηνία, είδη, τιμές).
// Φάση 2: φωτογραφία + ανάγνωση QR.
// Φάση 3: OCR που συμπληρώνει τη φόρμα αυτόματα.

import { useState } from "react";
import { CHAINS } from "../data/chains.js";

export default function NewReceipt() {
  const [chainId, setChainId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

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
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <p>
        Επιλογή: {chainId} / {date}
      </p>
      <div className="card">
        <p className="muted">Εδώ θα μπει η φόρμα καταχώρισης (Φάση 1).</p>
      </div>
    </section>
  );
}
