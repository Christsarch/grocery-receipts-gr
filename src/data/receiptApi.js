// Μιλάει με τον Worker: του δίνει τον σύνδεσμο του QR και παίρνει πίσω την απόδειξη
// στη μορφή { chainId, afm, date, items }.

// Στον υπολογιστή (npm run dev) ο Worker τρέχει τοπικά, online είναι στο workers.dev
const WORKER_URL = import.meta.env.DEV
  ? "http://localhost:8787"
  : "https://grocery-receipts-api.christsarch.workers.dev";

export async function fetchReceipt(qrUrl) {
  // Το encodeURIComponent χρειάζεται γιατί ο σύνδεσμος του QR μπαίνει μέσα σε άλλον σύνδεσμο
  let response;
  try {
    response = await fetch(`${WORKER_URL}/?url=${encodeURIComponent(qrUrl)}`);
  } catch {
    // Το fetch πετάει λάθος μόνο αν δεν υπάρχει καθόλου σύνδεση (χωρίς internet, ή ο Worker δεν τρέχει)
    throw new Error("Δεν υπάρχει σύνδεση με την υπηρεσία αποδείξεων");
  }

  // Λάθος από τον Worker (400 ή 502): το μήνυμά του είναι ήδη στα ελληνικά
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}
