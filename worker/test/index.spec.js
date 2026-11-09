import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';
import { UNSUPPORTED_PROVIDER } from '../src/messages.js';

// Καλεί τον Worker όπως θα τον καλούσε ο browser, χωρίς δίκτυο
async function callWorker(query, origin) {
	const headers = origin ? { Origin: origin } : {};
	const request = new Request(`http://localhost:8787/${query}`, { headers });
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, env, ctx);
	await waitOnExecutionContext(ctx);
	return response;
}

describe('Worker: έλεγχοι εισόδου', () => {
	it('χωρίς σύνδεσμο: 400', async () => {
		const response = await callWorker('');
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Λείπει ο σύνδεσμος της απόδειξης');
	});

	it('κείμενο που δεν είναι σύνδεσμος: 400', async () => {
		const response = await callWorker('?url=abc');
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Μη έγκυρος σύνδεσμος');
	});

	it('άλλος πάροχος: 400 με οδηγίες για το αρχείο myDATA', async () => {
		const response = await callWorker('?url=' + encodeURIComponent('https://example.com/receipt/1'));
		expect(response.status).toBe(400);
		expect(await response.text()).toBe(UNSUPPORTED_PROVIDER);
	});

	it('σωστό site, λάθος μορφή συνδέσμου: 400', async () => {
		const response = await callWorker('?url=' + encodeURIComponent('https://e-invoicing.gr/'));
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Μη έγκυρος σύνδεσμος');
	});
});

describe('Worker: CORS', () => {
	it('η εφαρμογή μας παίρνει άδεια ανάγνωσης, και στα λάθη', async () => {
		const response = await callWorker('?url=abc', 'https://christsarch.github.io');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://christsarch.github.io');
	});

	it('άλλο site δεν παίρνει άδεια', async () => {
		const response = await callWorker('?url=abc', 'https://www.google.com');
		expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
	});
});
