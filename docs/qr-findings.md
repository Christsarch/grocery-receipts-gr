# What the receipt QR code leads to

Findings from real receipts, chain by chain. They explain why the app imports receipts the way it does.
No real receipt links, tokens or MARK numbers appear here: the examples use made-up values.

## Two kinds of QR code on Greek receipts

| Kind | Where it points | What it contains |
|---|---|---|
| Cash register (older tills) | `www1.aade.gr/tameiakes/...` | A signature and the **totals** only. No items. |
| Electronic receipt (via a licensed provider) | The provider's own page | The full document, with every item. The receipt also prints a **MARK** (the unique number the tax authority, AADE, gives every document) and the provider's website. |

AADE licenses around 40 providers and does not require them to use a common viewer or format, so each provider needs its own investigation.

## Masoutis → Entersoft (e-invoicing.gr)

- **QR link:** `https://e-invoicing.gr/edocuments/ViewInvoice/<ofenm>/<id>_<token>`
- **The page** shows the receipt inside an iframe. The iframe loads
  `/api/GetInvoice?contentType=PEPPOL&intRefDocID=<id>&hashToken=<token>&ofenm=<ofenm>&isPreview=True`.
  With `isPreview=False` the same address returns the raw document.
- **Format:** UBL XML following the European standard **EN 16931 / PEPPOL BIS Billing 3.0**, wrapped in a `StandardBusinessDocument`, UTF-8.
- **Parsing notes** (prototype in `research/ubl-parser.ipynb`, production code in `worker/src/receipt.js`):
  - Line total = `LineExtensionAmount` (net) + the line's own `TaxTotal/TaxAmount`. Computing `net × (1 + VAT rate)` instead is off by one cent on some lines, because the net amount is itself rounded from the shelf price.
  - Units: `H87` = piece, `58` = net kilogram (used by Entersoft for loose produce), `KGM` = kilogram. Unknown codes are rejected instead of silently becoming "piece".
  - The chain is identified by the supplier's tax number (`EndpointID`). All branches share it.
  - The MARK is in an `AdditionalDocumentReference` with description `##M.AR.K##`. The app uses it to detect duplicate receipts.
  - The document also carries the shop branch, the shelf price (`VatIncludedPrice`) and a **customer/loyalty code**. The Worker returns only the items, so the loyalty code never reaches the app.
- **Access:** a plain HTTP request works, so a small Cloudflare Worker fetches the XML for the app (browsers block reading another site directly).

## AB Vasilopoulos → Epsilon Digital (epsilonnet.gr)

- **QR link:** `https://epsilondigital-abmarket.epsilonnet.gr/DocViewer/<id>`
- **The page** is a **Blazor Server** application: after the first load, all data travels over an encrypted WebSocket, so there is no simple data request to call (the browser's Network tab shows no Fetch/XHR requests).
- It also uses **Cloudflare Turnstile** (bot detection) and its `robots.txt` disallows automated access.
- **Decision:** no automated fetching for this provider. Working around active anti-bot measures would be a grey zone, and this project stays out of it.
- **What works instead:** the page offers three downloads: **PDF**, **myData** and **myData (detailed)**. The user downloads the file themselves and the app reads it in the browser.

## The myDATA file (AADE schema)

- Namespace `http://www.aade.gr/myDATA/invoice/v1.0`. This is the tax authority's own schema, which every provider uses to report to AADE, so one parser covers any provider that offers this download.
- **"myData (detailed)"** has one `invoiceDetails` per item: `itemDescr`, `quantity`, `measurementUnit`, `netValue`, `vatAmount`.
- **"myData"** (simple) has one line per VAT rate with totals only. The app detects it (no `itemDescr`) and asks for the detailed file.
- Units (AADE table 8.13): `1` pieces, `2` kilograms, `3` litres, `4` metres, `5` square metres, `6` cubic metres, `7` pieces (other cases).
- **Discounts are already applied** to the line. A product bought with a discount appears with the price actually paid, and the shelf price is lost. Known limitation for price comparison.
- Line total = `netValue` + `vatAmount`, the same rule as the UBL file. Checked against `totalGrossValue`.
- The file also contains card payment details (terminal and transaction ids). The parser ignores them.
- The **PDF** has a real text layer (not a scanned image), so it could be parsed as a fallback, but the detailed myDATA file makes that unnecessary.

## Reading the QR code from a photo

- Thermal printers leave thin **white lines** through the QR code, and common decoders (jsQR, ZXing) fail on them.
- The direction of the lines in the photo depends on the printer and on how the phone was held: on the Masoutis receipt they were horizontal, on the AB receipt vertical.
- **Fix** (`src/image/qr.js`): a directional minimum filter (morphological erosion of the white) that "closes" the lines, tried horizontally and vertically with increasing strength, first at full size and then at half size. The phone's native `BarcodeDetector` is tried first when the browser has one (Chrome on Android).

| Test image | Before | After |
|---|---|---|
| QR crop, Masoutis | read | read |
| Whole receipt, AB | not read | read (about 2.5 s on a laptop) |
| Whole receipt, AB, rotated 90° | not read | read |
| Whole receipt, AB, upside down | not read | not read |

## Other chains

| Chain | Provider | Status |
|---|---|---|
| Lidl | ? | Mostly digital receipts in the Lidl Plus app; paper only on request |
| Sklavenitis | ? | Waiting for a receipt |
| My Market | ? | Waiting for a receipt |

The fastest way to find out: the provider's website is printed under the MARK on every electronic receipt.

## Ground rules

Fetching your own receipt from the link printed on it, at personal volume, for yourself, family and friends. Only providers that serve the document to a normal request, with no logs kept by the Worker. Anything that requires getting around bot detection is out of scope. To revisit if the app ever becomes public: each provider's terms of use.
