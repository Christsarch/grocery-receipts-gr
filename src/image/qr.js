import jsQR from "jsqr";

// "Γεμίζει" τις λεπτές λευκές οριζόντιες γραμμές που αφήνουν οι θερμικοί εκτυπωτές.
// Κάθε pixel παίρνει το πιο σκούρο χρώμα από τους γείτονές του από πάνω και από κάτω,
// σε απόσταση έως k pixel (μορφολογική διάβρωση των λευκών, στον κατακόρυφο άξονα).
export function fillPrinterLines(imageData, k) {
  const { data, width, height } = imageData;

  // Πρώτα μετατρέπουμε σε αποχρώσεις του γκρι: μία τιμή φωτεινότητας ανά pixel
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  }

  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let darkest = 255;
      for (let d = -k; d <= k; d++) {
        const yy = Math.min(height - 1, Math.max(0, y + d));
        darkest = Math.min(darkest, gray[yy * width + x]);
      }
      const i = (y * width + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = darkest;
      out[i + 3] = 255;
    }
  }
  return out;
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

  // Σκαλί 3: η jsQR αφού "γεμίσουμε" τις λευκές γραμμές του εκτυπωτή,
  // από το πιο λεπτό γέμισμα στο πιο χοντρό
  for (const k of [1, 2, 3, 4]) {
    const filled = fillPrinterLines(imageData, k);
    const filledCode = jsQR(filled, imageData.width, imageData.height);
    if (filledCode !== null) {
      return filledCode.data;
    }
  }

  return null;
}
