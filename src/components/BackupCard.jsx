// Κάρτα στην Αρχική: εξαγωγή και επαναφορά αντιγράφου ασφαλείας
import { useRef, useState } from "react";
import { exportBackup, downloadJson, importBackup } from "../data/backup.js";

export default function BackupCard() {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");

  async function handleExport() {
    const data = await exportBackup();
    const today = new Date().toISOString().slice(0, 10);
    downloadJson(data, `apodeixeis-${today}.json`);
    setMessage(`Αποθηκεύτηκαν ${data.receipts.length} αποδείξεις στις Λήψεις.`);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const added = await importBackup(await file.text());
      setMessage(
        added === 0
          ? "Όλες οι αποδείξεις του αρχείου υπάρχουν ήδη."
          : `Προστέθηκαν ${added} αποδείξεις.`,
      );
    } catch (error) {
      setMessage(error.message);
    }
    e.target.value = "";
  }

  return (
    <div className="card backup-card">
      <h3>Αντίγραφο ασφαλείας</h3>
      <p className="muted">
        Οι αποδείξεις σου υπάρχουν μόνο σε αυτή τη συσκευή. Κράτα ένα αντίγραφο,
        ή μετέφερέ τες σε άλλη συσκευή.
      </p>
      <div className="backup-buttons">
        <button type="button" onClick={handleExport}>
          ⬇ Εξαγωγή
        </button>
        <button type="button" onClick={() => fileInputRef.current.click()}>
          ⬆ Επαναφορά
        </button>
      </div>
      <input ref={fileInputRef} type="file" hidden onChange={handleImport} />
      {message && <p className="muted status">{message}</p>}
    </div>
  );
}
