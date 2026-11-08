import { XMLParser } from 'fast-xml-parser';

// Κωδικοί μονάδας του προτύπου (UN/ECE Rec. 20) → οι δικές μας μονάδες
// H87: τεμάχιο, KGM: κιλό, 58: καθαρό κιλό (το χρησιμοποιεί η Entersoft)
const UNITS = { H87: 'piece', KGM: 'kg', 58: 'kg' };

// ΑΦΜ προμηθευτή → αλυσίδα. Εισαγωγικά στα κλειδιά, για να μη χαθεί το 0 μπροστά.
const CHAIN_BY_AFM = { '094063140': 'masoutis', '094025817': 'ab' };

// Ο parser φτιάχνεται μία φορά, όχι σε κάθε αίτημα
const parser = new XMLParser({
	removeNSPrefix: true, // "cbc:IssueDate" → "IssueDate"
	ignoreAttributes: false, // κράτα τα attributes, π.χ. unitCode="58" → "@_unitCode"
	parseTagValue: false, // όλα ως κείμενο, για να μη χαθεί το 0 μπροστά στον ΑΦΜ
	// Πάντα πίνακες, ακόμα και με ένα στοιχείο: τα είδη, και τα πρόσθετα στοιχεία (εκεί είναι ο ΜΑΡΚ)
	isArray: (name) => name === 'InvoiceLine' || name === 'AdditionalDocumentReference',
});

// Από κείμενο σε ευρώ ("1.13") σε ακέραια λεπτά (113)
function toCents(text) {
	return Math.round(Number(text) * 100);
}

// Από το XML της απόδειξης (EN 16931 / PEPPOL UBL) στο σχήμα της εφαρμογής:
// { chainId, afm, mark, date, items: [{ name, unit, quantity, lineTotalInCents, unitPriceInCents }] }
// Πετάει λάθος αν βρει άγνωστη μονάδα ή αν τα είδη δεν αθροίζουν στο σύνολο.
export function parseReceipt(xmlText) {
	const invoice = parser.parse(xmlText).StandardBusinessDocument.Invoice;

	const afm = invoice.AccountingSupplierParty.Party.EndpointID['#text'];
	const date = invoice.IssueDate;

	// ΜΑΡΚ: ο μοναδικός αριθμός της ΑΑΔΕ για κάθε παραστατικό (για τον έλεγχο διπλοεγγραφής)
	const markRef = invoice.AdditionalDocumentReference.find((ref) => ref.DocumentDescription === '##M.AR.K##');
	const mark = markRef?.ID ?? null;

	const items = [];
	let totalInCents = 0;
	for (const line of invoice.InvoiceLine) {
		// Ποσότητα και μονάδα
		const quantity = Number(line.InvoicedQuantity['#text']);
		const code = line.InvoicedQuantity['@_unitCode'];
		const unit = UNITS[code];
		if (unit === undefined) {
			throw new Error(`Άγνωστος κωδικός μονάδας: ${code}`);
		}

		// Σύνολο γραμμής = καθαρή αξία + ΦΠΑ της γραμμής, όπως τα γράφει η απόδειξη
		const netInCents = toCents(line.LineExtensionAmount['#text']);
		const vatInCents = toCents(line.TaxTotal.TaxAmount['#text']);
		const lineTotalInCents = netInCents + vatInCents;
		totalInCents += lineTotalInCents;

		const name = line.Item.Name;
		const unitPriceInCents = Math.round(lineTotalInCents / quantity);
		items.push({ name, unit, quantity, lineTotalInCents, unitPriceInCents });
	}

	// Έλεγχος: τα είδη πρέπει να αθροίζουν ακριβώς στο πληρωτέο ποσό
	const payableInCents = toCents(invoice.LegalMonetaryTotal.PayableAmount['#text']);
	if (totalInCents !== payableInCents) {
		throw new Error(`Τα είδη αθροίζουν ${totalInCents} λεπτά, αλλά το σύνολο είναι ${payableInCents}`);
	}

	return { chainId: CHAIN_BY_AFM[afm] ?? null, afm, mark, date, items };
}
