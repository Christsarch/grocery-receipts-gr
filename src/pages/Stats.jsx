// Στατιστικά: έξοδα ανά μήνα, και για τον μήνα που διαλέγεις, ανά αλυσίδα και ανά κατηγορία.
// Τα σύνολα τα υπολογίζει το stats.js. Εδώ μόνο τα ζωγραφίζουμε με τη βιβλιοθήκη Recharts.
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import { db } from "../data/db.js";
import { formatCents } from "../data/money.js";
import {
  totalsByMonth,
  totalsByChain,
  totalsByCategory,
} from "../data/stats.js";

// "2026-11" → "Νοε 26" (για τον άξονα) και "Νοέμβριος 2026" (για τη λίστα επιλογής)
function shortMonth(month) {
  const date = new Date(`${month}-01`);
  return date.toLocaleString("el-GR", { month: "short", year: "2-digit" });
}
function longMonth(month) {
  const date = new Date(`${month}-01`);
  return date.toLocaleString("el-GR", { month: "long", year: "numeric" });
}

// Ένα οριζόντιο ραβδόγραμμα (αλυσίδες, κατηγορίες): μία μπάρα ανά γραμμή, με το ποσό δίπλα
function HorizontalBars({ data }) {
  // Ύψος ανάλογο με το πλήθος των γραμμών, ώστε να μη στριμώχνονται
  const height = data.length * 40 + 20;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 70 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fill: "var(--text)", fontSize: 13 }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="total" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={22}>
          <LabelList
            dataKey="total"
            position="right"
            formatter={(cents) => formatCents(cents)}
            style={{ fill: "var(--text)", fontSize: 13 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Stats() {
  const receipts = useLiveQuery(() => db.receipts.toArray());
  const overrideList = useLiveQuery(() => db.categoryOverrides.toArray());
  // Ποιος μήνας φαίνεται στα "ανά αλυσίδα" και "ανά κατηγορία" (null: ο πιο πρόσφατος)
  const [selectedMonth, setSelectedMonth] = useState(null);

  if (receipts === undefined) {
    return (
      <section className="page">
        <h2>Στατιστικά</h2>
        <div className="card empty">
          <p>Φόρτωση…</p>
        </div>
      </section>
    );
  }

  if (receipts.length === 0) {
    return (
      <section className="page">
        <h2>Στατιστικά</h2>
        <div className="card empty">
          <p>Τα γραφήματα θα εμφανιστούν μόλις αποθηκεύσεις αποδείξεις.</p>
        </div>
      </section>
    );
  }

  const overrides = Object.fromEntries(
    (overrideList ?? []).map(({ name, categoryId }) => [name, categoryId]),
  );

  const months = totalsByMonth(receipts);
  // Αν ο χρήστης δεν έχει διαλέξει, ο τελευταίος μήνας της λίστας (ο πιο πρόσφατος)
  const month = selectedMonth ?? months[months.length - 1].month;
  const monthReceipts = receipts.filter((r) => r.date.startsWith(month));

  // Για το γράφημα: ευρώ αντί για λεπτά στον άξονα, και σύντομο όνομα μήνα
  const monthBars = months.map((m) => ({
    label: shortMonth(m.month),
    total: m.total,
  }));

  return (
    <section className="page">
      <h2>Στατιστικά</h2>

      <div className="card chart-card">
        <h3>Έξοδα ανά μήνα</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthBars} margin={{ top: 24, left: 0, right: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--accent-soft)" }}
              formatter={(cents) => [formatCents(cents), "Σύνολο"]}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              labelStyle={{ color: "var(--text)" }}
            />
            <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]}>
              <LabelList
                dataKey="total"
                position="top"
                formatter={(cents) => formatCents(cents)}
                style={{ fill: "var(--text)", fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="field">
        <label>Μήνας</label>
        <select value={month} onChange={(e) => setSelectedMonth(e.target.value)}>
          {months.map((m) => (
            <option key={m.month} value={m.month}>
              {longMonth(m.month)}
            </option>
          ))}
        </select>
      </div>

      <div className="card chart-card">
        <h3>Ανά αλυσίδα</h3>
        <HorizontalBars data={totalsByChain(monthReceipts)} />
      </div>

      <div className="card chart-card">
        <h3>Ανά κατηγορία</h3>
        <HorizontalBars data={totalsByCategory(monthReceipts, overrides)} />
      </div>
    </section>
  );
}
