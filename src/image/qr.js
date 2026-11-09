import jsQR from "jsqr";

// Οι θερμικοί εκτυπωτές αφήνουν λεπτές λευκές γραμμές μέσα στο QR. Ανάλογα με τον εκτυπωτή
// και με το πώς κρατήθηκε το κινητό, οι γραμμές βγαίνουν οριζόντιες ή κάθετες στη φωτογραφία
// (π.χ. Μασούτης: οριζόντιες, ΑΒ: κάθετες). Γι' αυτό δοκιμάζουμε γέμισμα και στις δύο κατευθύνσεις.
// Κάθε ζεύγος είναι [kx, ky]: πόσα pixel γεμίζουμε οριζόντια και κάθετα. Από το πιο ελαφρύ στο πιο βαρύ.
const FILLS = [
  [0, 1], [0, 2], [0, 3],
  [1, 0], [2, 0], [3, 0],
  [1, 1], [2, 2],
];

// Μία τιμή φωτεινότητας (γκρι) ανά pixel
function toGray(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  }
  return gray;
}

// Κάθε pixel παίρνει το πιο σκούρο χρώμα από τους γείτονές του σε απόσταση έως k,
// σε μία κατεύθυνση (μορφολογική διάβρωση των λευκών). Έτσι "κλείνουν" οι λευκές γραμμές.
function darkenAlong(gray, width, height, k, horizontal) {
  const out = new Uint8ClampedArray(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let darkest = 255;
      for (let d = -k; d <= k; d++) {
        const xx = horizontal ? Math.min(width - 1, Math.max(0, x + d)) : x;
        const yy = horizontal ? y : Math.min(height - 1, Math.max(0, y + d));
        darkest = Math.min(darkest, gray[yy * width + xx]);
      }
      out[y * width + x] = darkest;
    }
  }
  return out;
}

// Γεμίζει τις λευκές γραμμές: kx pixel οριζόντια (για κάθετες γραμμές), ky κάθετα (για οριζόντιες).
// Επιστρέφει pixel σε μορφή RGBA, όπως τα θέλει η jsQR.
export function fillPrinterLines(gray, width, height, kx, ky) {
  let filled = gray;
  if (kx > 0) {
    filled = darkenAlong(filled, width, height, kx, true);
  }
  if (ky > 0) {
    filled = darkenAlong(filled, width, height, ky, false);
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = filled[i];
    rgba[i * 4 + 3] = 255;
  }
  return rgba;
}

// Μισό μέγεθος (μέσος όρος 2×2 pixel). Σε μεγάλες φωτογραφίες ολόκληρης απόδειξης,
// η jsQR βρίσκει μερικές φορές το QR πιο εύκολα σε μικρότερη εικόνα.
function halve(gray, width, height) {
  const w = Math.floor(width / 2);
  const h = Math.floor(height / 2);
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = 2 * y * width + 2 * x;
      out[y * w + x] = (gray[i] + gray[i + 1] + gray[i + width] + gray[i + width + 1]) / 4;
    }
  }
  return { gray: out, width: w, height: h };
}

// Αφήνει τον browser να ζωγραφίσει την οθόνη (π.χ. το "Αναζήτηση QR…") ανάμεσα στις δοκιμές
function letBrowserPaint() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function readQr(canvas) {
  // Σκαλί 1: η μηχανή του κινητού (π.χ. Chrome στο Android), αν υπάρχει
  if ("BarcodeDetector" in window) {
    try {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const codes = await detector.detect(canvas);
      if (codes.length > 0) {
        return codes[0].rawValue;
      }
    } catch {
      // Ο browser δεν μπόρεσε: συνεχίζουμε στο επόμενο σκαλί
    }
  }

  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Σκαλί 2: η jsQR στην εικόνα όπως είναι
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (code !== null) {
    return code.data;
  }

  // Σκαλί 3: η jsQR αφού γεμίσουμε τις λευκές γραμμές, πρώτα σε πλήρες και μετά σε μισό μέγεθος
  let image = { gray: toGray(imageData), width: imageData.width, height: imageData.height };
  for (const size of ["full", "half"]) {
    if (size === "half") {
      image = halve(image.gray, image.width, image.height);
    }
    for (const [kx, ky] of FILLS) {
      await letBrowserPaint();
      const filled = fillPrinterLines(image.gray, image.width, image.height, kx, ky);
      const filledCode = jsQR(filled, image.width, image.height);
      if (filledCode !== null) {
        return filledCode.data;
      }
    }
  }

  return null;
}
