# Αποδείξεις · grocery receipt tracker

Scan the QR code of a Greek supermarket receipt and see where your money goes: spending per month, per chain and per category, and which chain gave you the best price for the same product.

**Live demo:** https://christsarch.github.io/grocery-receipts-gr/ *(work in progress)*

## Why

Grocery spending is one of the biggest monthly expenses for students and households, yet the only record of it is a pile of thermal receipts. This app turns those receipts into a personal price history, using only your own data.

## How it works

- **Progressive Web App:** runs in the phone browser and installs to the home screen; one codebase for Android and iOS.
- **QR code reading in the browser:** the phone's native `BarcodeDetector` when available, otherwise jsQR, with a small image-processing step that fills the white lines thermal printers leave across the code. Photos never leave the device.
- **Electronic receipts, not OCR:** Greek retail receipts link to the provider's copy of the document, available as an **EN 16931 / PEPPOL BIS Billing 3.0** UBL XML. The app parses that European standard instead of guessing from a photo, and checks that the line totals add up to the receipt total.
- **A tiny, stateless proxy:** a Cloudflare Worker fetches the XML on the app's behalf (browsers block cross-site reads), parses it and returns only the items as JSON, so payment and loyalty-card details never reach the app. It only accepts known receipt providers and keeps no logs.
- **Local-first storage:** receipts live in IndexedDB on your device. No account, no database server.
- **Free to run:** GitHub Pages, GitHub Actions and the Cloudflare Workers free plan.

## Tech stack

React · Vite · IndexedDB (Dexie) · jsQR · Cloudflare Workers · GitHub Actions / Pages · Python (parser prototype in `research/`)

## Status

See [ROADMAP.md](ROADMAP.md) for the phased plan (in Greek).

- [x] Phase 0: project skeleton, CI deploy
- [x] Phase 1: manual entry and local storage
- [x] Phase 2: camera and receipt QR code
- [ ] Phase 3: electronic receipt import (in progress: QR reading and the Worker that fetches and parses the receipt are done; app integration next)
- [ ] Phase 4: spending statistics
- [ ] Phase 5: product matching across chains, offline PWA, v1.0

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Privacy

Real receipts (photos, XML files, receipt links) are never committed to this repository. Photos are processed on the device; the only thing that leaves it is the receipt link, sent to the app's own Worker, which keeps nothing.
