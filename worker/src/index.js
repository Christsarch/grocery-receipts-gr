// Από τον σύνδεσμο του QR της Entersoft στον σύνδεσμο του XML (πρότυπο PEPPOL)
function entersoftXmlUrl(qrUrl) {
	const url = new URL(qrUrl);
	const parts = url.pathname.split('/');
	const ofenm = parts[3];
	const [id, token] = parts[4].split('_');

	return `https://e-invoicing.gr/api/GetInvoice?contentType=PEPPOL&intRefDocID=${id}&hashToken=${token}&ofenm=${ofenm}&isPreview=False`;
}

export default {
	async fetch(request, env, ctx) {
		// Προσωρινή δοκιμή με ψεύτικο σύνδεσμο (ποτέ πραγματική απόδειξη στον κώδικα: ανεβαίνει δημόσια στο GitHub)
		return new Response(entersoftXmlUrl('https://e-invoicing.gr/edocuments/ViewInvoice/-1/00000000-0000-0000-0000-000000000000_abc123'));
	},
};
