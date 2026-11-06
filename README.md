# Αποδείξεις · grocery receipt tracker

Snap a photo of a Greek supermarket receipt and see where your money goes: spending per month, per chain and per category, and which chain gave you the best price for the same product.

**Live demo:** https://christsarch.github.io/grocery-receipts-gr/ *(work in progress)*

## Why

Grocery spending is one of the biggest monthly expenses for students and households, yet the only record of it is a pile of thermal receipts. This app turns those receipts into a personal price history, using only your own data.

## How it works

- **Progressive Web App:** runs in the phone browser and installs to the home screen; one codebase for Android and iOS.
- **On-device OCR:** receipts are read in the browser with Tesseract.js (Greek). Photos never leave the device.
- **Local-first storage:** data lives in IndexedDB on your device. No server, no account.
- **Free to run:** static hosting on GitHub Pages, deployed by GitHub Actions on every push.

## Tech stack

React · Vite · IndexedDB (Dexie) · Tesseract.js · GitHub Actions / Pages

## Status

See [ROADMAP.md](ROADMAP.md) for the phased plan (in Greek).

- [x] Phase 0: project skeleton, CI deploy
- [x] Phase 1: manual entry and local storage
- [ ] Phase 2: camera and receipt QR code
- [ ] Phase 3: OCR and receipt parsing
- [ ] Phase 4: spending statistics
- [ ] Phase 5: product matching across chains, offline PWA, v1.0

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Privacy

Real receipt photos are never committed to this repository. All processing happens on the user's device.
