// Αρχική: σύνοψη των εξόδων του τρέχοντος μήνα.
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db.js";
import { formatCents, receiptsTotalInCents } from "../data/money.js";
import BackupCard from "../components/BackupCard.jsx";

export default function Home({ onNavigate }) {
  const receipts = useLiveQuery(() => db.receipts.toArray());

  if (receipts === undefined) {
    return (
      <section className="page">
        <div className="card empty">
          <p className="muted">Φόρτωση…</p>
        </div>
      </section>
    );
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // π.χ. "2026-11"
  const monthName = new Date().toLocaleDateString("el-GR", {
    month: "long",
    year: "numeric",
  }); // π.χ. "Νοέμβριος 2026"

  const monthReceipts = receipts.filter((receipt) =>
    receipt.date.startsWith(currentMonth),
  );

  const monthTotalInCents = receiptsTotalInCents(monthReceipts);

  if (monthReceipts.length === 0) {
    return (
      <section className="page">
        <div className="card empty">
          <p className="empty-title">Καμία απόδειξη αυτόν τον μήνα</p>
          <p className="muted">
            Πρόσθεσε μια απόδειξη και εδώ θα βλέπεις πόσα ξόδεψες αυτόν τον μήνα
            και σε ποια σούπερ μάρκετ.
          </p>
          <button className="primary" onClick={() => onNavigate("new")}>
            Νέα απόδειξη
          </button>
        </div>
        <BackupCard />
      </section>
    );
  }

  return (
    <section className="page">
      <div className="card">
        <p className="muted">{monthName}</p>
        <p className="big-total">{formatCents(monthTotalInCents)}</p>
        <p className="muted">από {monthReceipts.length} αποδείξεις</p>
      </div>
      <BackupCard />
    </section>
  );
}
