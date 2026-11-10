# Αποδείξεις · grocery receipt tracker

Scan the QR code of a Greek supermarket receipt and see where your money goes: spending per month, per chain and per category, and which chain gave you the best price for the same product.

**Live demo:** https://christsarch.github.io/grocery-receipts-gr/

## Why

Grocery spending is one of the biggest monthly expenses for students and households, yet the only record of it is a pile of thermal receipts. This app turns those receipts into a personal price history, using only your own data.

## How it works

- **Web app for the phone:** runs in the browser, one codebase for Android and iOS (installing to the home screen and offline use come in Phase 5).
- **QR code reading in the browser:** live camera scanning (like a scanner app) or a photo. Decoding uses the phone's native `BarcodeDetector` when available, otherwise ZXing compiled to WebAssembly, with an image-processing step that closes the white lines thermal printers leave across the code. On a benchmark of 300 synthetic thermal-receipt photos it reads 97% of them in about 0.1 s each. Images never leave the device.
- **Electronic receipts, not OCR:** Greek retail receipts link to the provider's copy of the document, available as an **EN 16931 / PEPPOL BIS Billing 3.0** UBL XML. The app parses that European standard instead of guessing from a photo, and checks that the line totals add up to the receipt total. The receipt's MARK (the unique number the Greek tax authority assigns to every receipt) prevents saving the same receipt twice.
- **Official myDATA files as a second route:** some providers block automated access, so for them the user downloads the receipt's "myData (detailed)" file (the Greek tax authority's own XML schema, the same for every provider) and the app parses it in the browser.
- **A tiny, stateless proxy:** a Cloudflare Worker fetches the XML on the app's behalf (browsers block cross-site reads), parses it and returns only the items as JSON, so payment and loyalty-card details never reach the app. It only accepts known receipt providers and keeps no logs.
- **Categories and charts:** every item gets a category from keyword rules ("ΓΙΑΟΥΡΤΙ" → Dairy & eggs); the user can correct any of them and the app remembers the correction for that product from then on. Spending charts per month, per chain and per category (Recharts).
- **Local-first storage:** receipts live in IndexedDB on your device. No account, no database server.
- **Free to run:** GitHub Pages, GitHub Actions and the Cloudflare Workers free plan.

How each provider was investigated, and why some are imported automatically and others through a file: [docs/qr-findings.md](docs/qr-findings.md).

## Tech stack

React · Vite · IndexedDB (Dexie) · ZXing (zxing-wasm) · Recharts · Cloudflare Workers · GitHub Actions / Pages · Python (parser prototype in `research/`)

## Status

See [ROADMAP.md](ROADMAP.md) for the phased plan (in Greek).

- [x] Phase 0: project skeleton, CI deploy
- [x] Phase 1: manual entry and local storage
- [x] Phase 2: camera and receipt QR code
- [x] Phase 3: electronic receipt import: Masoutis via QR scan, AB via the provider's myDATA file, duplicate detection by MARK (v0.1.0). More providers are added as real receipts come in.
- [x] Phase 4: receipt details, categories with user corrections, spending charts, live camera QR scanning (v0.2.0)
- [ ] Phase 5: product matching across chains, offline PWA, v1.0

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Privacy

Real receipts (photos, XML files, receipt links) are never committed to this repository. Photos are processed on the device; the only thing that leaves it is the receipt link, sent to the app's own Worker, which keeps nothing.
