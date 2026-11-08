import { parseReceipt } from './receipt.js';

// Από τον σύνδεσμο του QR της Entersoft στον σύνδεσμο του XML (πρότυπο PEPPOL).
// Μορφή του QR: https://e-invoicing.gr/edocuments/ViewInvoice/<ofenm>/<id>_<token>
// Αν ο σύνδεσμος δεν έχει αυτή τη μορφή, επιστρέφει null.
function entersoftXmlUrl(qrUrl) {
	const url = new URL(qrUrl);
	const parts = url.pathname.split('/'); // ["", "edocuments", "ViewInvoice", ofenm, "id_token"]
	if (parts.length !== 5 || parts[2] !== 'ViewInvoice') {
		return null;
	}

	const ofenm = parts[3];
	const [id, token] = parts[4].split('_');
	if (!id || !token) {
		return null;
	}

	return `https://e-invoicing.gr/api/GetInvoice?contentType=PEPPOL&intRefDocID=${id}&hashToken=${token}&ofenm=${ofenm}&isPreview=False`;
}

// Οι πάροχοι που δεχόμαστε. Ο Worker δεν ανοίγει ποτέ άλλο site.
const ALLOWED_HOSTS = ['e-invoicing.gr'];

// Ο Worker: δέχεται ?url=<σύνδεσμος του QR> και επιστρέφει τα είδη της απόδειξης ως JSON.
// Δεν κρατάει τίποτα: ούτε αρχεία, ούτε logs.
export default {
	async fetch(request, env, ctx) {
		// Η παράμετρος "url" (ή null αν λείπει, ή "" αν είναι κενή)
		const reqUrl = new URL(request.url);
		const qrUrl = reqUrl.searchParams.get('url');
		if (!qrUrl) {
			return new Response('Λείπει ο σύνδεσμος της απόδειξης', { status: 400 });
		}

		// Το new URL πετάει λάθος αν το κείμενο δεν είναι σύνδεσμος
		let parsedUrl;
		try {
			parsedUrl = new URL(qrUrl);
		} catch {
			return new Response('Μη έγκυρος σύνδεσμος', { status: 400 });
		}

		// Μόνο πάροχοι από τη λίστα
		if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
			return new Response('Άγνωστος πάροχος', { status: 400 });
		}

		// Σωστό site, αλλά λάθος μορφή συνδέσμου (π.χ. σκέτο https://e-invoicing.gr/)
		const xmlUrl = entersoftXmlUrl(qrUrl);
		if (xmlUrl === null) {
			return new Response('Μη έγκυρος σύνδεσμος', { status: 400 });
		}

		// Κατεβάζουμε το XML. Το fetch πετάει λάθος αν δεν υπάρχει καθόλου σύνδεση με τον πάροχο.
		let response;
		try {
			response = await fetch(xmlUrl);
		} catch {
			return new Response('Ο πάροχος δεν απάντησε', { status: 502 });
		}
		if (!response.ok) {
			return new Response('Ο πάροχος δεν απάντησε', { status: 502 });
		}

		// Διαβάζουμε το XML και στέλνουμε μόνο τα είδη, ως JSON (το Response.json βάζει μόνο του UTF-8).
		// Η parseReceipt πετάει λάθος αν τα δεδομένα του παρόχου δεν βγάζουν νόημα.
		const xmlText = await response.text();
		try {
			return Response.json(parseReceipt(xmlText));
		} catch {
			return new Response('Η απόδειξη δεν διαβάστηκε', { status: 502 });
		}
	},
};
