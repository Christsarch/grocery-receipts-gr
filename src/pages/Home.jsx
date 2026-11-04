
import { sampleReceipt } from "../data/sampleReceipt"
import { receiptTotalInCents } from "../data/money.js"
// Αρχική: σύνοψη του μήνα. Προς το παρόν δείχνει "κενή κατάσταση",
// γιατί δεν έχουμε ακόμα αποθηκευμένες αποδείξεις (έρχεται στη Φάση 1).
export default function Home({ onNavigate }) {

  const totalInCents = receiptTotalInCents(sampleReceipt);
  const totalText = (totalInCents / 100).toLocaleString("el-GR", { style: "currency", currency: "EUR" });

  return (
    <section className="page">
      <div className="card empty">
        <p className="empty-title">Δεν υπάρχουν αποδείξεις ακόμα</p>
        <p className="muted">
          Πρόσθεσε την πρώτη σου απόδειξη και εδώ θα βλέπεις πόσα ξόδεψες
          αυτόν τον μήνα και σε ποια σούπερ μάρκετ.
        </p>
        <p>Σύνολο δοκιμαστικής απόδειξης: {totalText}</p>
        <button className="primary" onClick={() => onNavigate('new')}>
          Νέα απόδειξη
        </button>
      </div>
    </section>
  )
}

