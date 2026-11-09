import { describe, it, expect } from 'vitest';
import { parseReceipt } from '../src/receipt.js';

// Μια ψεύτικη απόδειξη στη μορφή της Entersoft (UBL μέσα σε StandardBusinessDocument).
// Όλα τα στοιχεία είναι επινοημένα: ποτέ πραγματικές αποδείξεις στο repository.
function fakeReceipt({ lines, payable, afm = '094063140', mark = '400000000000001' }) {
	const invoiceLines = lines
		.map(
			(line) => `
		<cac:InvoiceLine>
			<cbc:InvoicedQuantity unitCode="${line.unit}">${line.quantity}</cbc:InvoicedQuantity>
			<cbc:LineExtensionAmount currencyID="EUR">${line.net}</cbc:LineExtensionAmount>
			<cac:TaxTotal><cbc:TaxAmount currencyID="EUR">${line.vat}</cbc:TaxAmount></cac:TaxTotal>
			<cac:Item><cbc:Name>${line.name}</cbc:Name></cac:Item>
		</cac:InvoiceLine>`,
		)
		.join('');

	return `<?xml version="1.0" encoding="UTF-8"?>
<StandardBusinessDocument xmlns="http://www.unece.org/cefact/namespaces/StandardBusinessDocumentHeader">
	<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
		xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
		xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
		<cbc:IssueDate>2026-01-15</cbc:IssueDate>
		<cac:AdditionalDocumentReference><cbc:ID>${mark}</cbc:ID><cbc:DocumentDescription>##M.AR.K##</cbc:DocumentDescription></cac:AdditionalDocumentReference>
		<cac:AccountingSupplierParty><cac:Party><cbc:EndpointID schemeID="9933">${afm}</cbc:EndpointID></cac:Party></cac:AccountingSupplierParty>
		<cac:LegalMonetaryTotal><cbc:PayableAmount currencyID="EUR">${payable}</cbc:PayableAmount></cac:LegalMonetaryTotal>
		${invoiceLines}
	</Invoice>
</StandardBusinessDocument>`;
}

const MILK = { name: 'ΓΑΛΑ ΦΡΕΣΚΟ 1L', unit: 'H87', quantity: '2', net: '2.30', vat: '0.30' };
const APPLES = { name: 'ΜΗΛΑ', unit: '58', quantity: '1.250', net: '1.77', vat: '0.23' };

describe('parseReceipt', () => {
	it('διαβάζει αλυσίδα, ΑΦΜ, ΜΑΡΚ και ημερομηνία', () => {
		const receipt = parseReceipt(fakeReceipt({ lines: [MILK], payable: '2.60' }));
		expect(receipt.chainId).toBe('masoutis');
		expect(receipt.afm).toBe('094063140'); // κρατάει το 0 μπροστά
		expect(receipt.mark).toBe('400000000000001');
		expect(receipt.date).toBe('2026-01-15');
	});

	it('σύνολο γραμμής = καθαρή αξία + ΦΠΑ, τιμή μονάδας = σύνολο / ποσότητα', () => {
		const receipt = parseReceipt(fakeReceipt({ lines: [MILK, APPLES], payable: '4.60' }));
		expect(receipt.items).toEqual([
			{ name: 'ΓΑΛΑ ΦΡΕΣΚΟ 1L', unit: 'piece', quantity: 2, lineTotalInCents: 260, unitPriceInCents: 130 },
			{ name: 'ΜΗΛΑ', unit: 'kg', quantity: 1.25, lineTotalInCents: 200, unitPriceInCents: 160 },
		]);
	});

	it('ένα μόνο είδος δίνει και πάλι πίνακα', () => {
		const receipt = parseReceipt(fakeReceipt({ lines: [MILK], payable: '2.60' }));
		expect(receipt.items).toHaveLength(1);
	});

	it('άγνωστος ΑΦΜ δίνει chainId null', () => {
		const receipt = parseReceipt(fakeReceipt({ lines: [MILK], payable: '2.60', afm: '000000000' }));
		expect(receipt.chainId).toBeNull();
	});

	it('άγνωστη μονάδα πετάει λάθος, αντί να γίνει σιωπηλά "piece"', () => {
		const juice = { ...MILK, unit: 'LTR' };
		expect(() => parseReceipt(fakeReceipt({ lines: [juice], payable: '2.60' }))).toThrow('LTR');
	});

	it('αν τα είδη δεν αθροίζουν στο σύνολο, πετάει λάθος', () => {
		expect(() => parseReceipt(fakeReceipt({ lines: [MILK], payable: '2.61' }))).toThrow('261');
	});
});
