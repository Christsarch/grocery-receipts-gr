// Ανάγνωση QR από εικόνα: από φωτογραφία (readQr) ή από καρέ της ζωντανής κάμερας (decodeFrame).
//
// Αποκωδικοποιητής: η ZXing (μέσω zxing-wasm), η ίδια βιβλιοθήκη που χρησιμοποιούν πολλές εφαρμογές
// σάρωσης, μεταγλωττισμένη σε WebAssembly ώστε να τρέχει σε κάθε browser. Είναι πολύ πιο ανθεκτική από
// την jsQR σε θόλωμα, κλίση και σκιές.
//
// Το πρόβλημα των αποδείξεων: οι θερμικοί εκτυπωτές αφήνουν λευκές γραμμές μέσα στο QR (οριζόντιες ή
// κάθετες, ανάλογα με τον εκτυπωτή και το πώς κρατήθηκε το κινητό). Γι' αυτό, αν η εικόνα δεν διαβαστεί
// όπως είναι, δοκιμάζουμε παραλλαγές όπου "κλείνουμε" τις γραμμές (κάθε pixel παίρνει το πιο σκούρο
// χρώμα των γειτόνων του) ή μικραίνουμε την εικόνα (ο μέσος όρος σβήνει τις λεπτές γραμμές).
// Η σειρά των παραλλαγών βγήκε από μετρήσεις σε 300 δύσκολες εικόνες (βλ. docs/qr-findings.md).
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import wasmUrl from "zxing-wasm/reader/zxing_reader.wasm?url";

// Το αρχείο WebAssembly σερβίρεται από την ίδια την εφαρμογή (όχι από CDN): δουλεύει και χωρίς τρίτους
prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => (path.endsWith(".wasm") ? wasmUrl : prefix + path),
  },
});

// Οι παραλλαγές για μια φωτογραφία, με τη σειρά που δοκιμάζονται.
// scale: πόσες φορές μικρότερη εικόνα · kx/ky: πόσα pixel γεμίζουμε οριζόντια/κάθετα ·
// binarizer: άλλος τρόπος να χωριστεί το μαύρο από το λευκό.
const PHOTO_STEPS = [
  { scale: 1, kx: 0, ky: 0 },
  { scale: 1, kx: 2, ky: 2 },
  { scale: 1, kx: 1, ky: 0 },
  { scale: 3, kx: 1, ky: 1 },
  { scale: 1, kx: 0, ky: 3 },
  { scale: 1, kx: 0, ky: 0, binarizer: "GlobalHistogram" },
  { scale: 2, kx: 0, ky: 3 },
  { scale: 2, kx: 0, ky: 1 },
  { scale: 2, kx: 0, ky: 2 },
  { scale: 1, kx: 4, ky: 4 },
];

// Για τη ζωντανή κάμερα: ένα ελαφρύ βήμα ανά καρέ, εναλλάξ. Τα καρέ έρχονται συνεχώς,
// οπότε δεν χρειάζεται να δοκιμάσουμε τα πάντα στο ίδιο καρέ.
const FRAME_STEPS = [
  { scale: 1, kx: 0, ky: 0 },
  { scale: 1, kx: 2, ky: 2 },
  { scale: 1, kx: 1, ky: 0 },
  { scale: 1, kx: 0, ky: 1 },
  { scale: 2, kx: 1, ky: 1 },
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

// Κάθε pixel παίρνει το πιο σκούρο χρώμα των γειτόνων του σε απόσταση έως k, σε μία κατεύθυνση
function darkenAlong(gray, width, height, k, horizontal) {
  const out = new Uint8ClampedArray(gray.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let darkest = 255;
      for (let d = -k; d <= k; d++) {
        const xx = horizontal ? Math.min(width - 1, Math.max(0, x + d)) : x;
        const yy = horizontal ? y : Math.min(height - 1, Math.max(0, y + d));
        const value = gray[yy * width + xx];
        if (value < darkest) darkest = value;
      }
      out[y * width + x] = darkest;
    }
  }
  return out;
}

// Μικραίνει την εικόνα f φορές, με μέσο όρο των pixel κάθε τετραγώνου f×f
function shrink(gray, width, height, f) {
  const w = Math.floor(width / f);
  const h = Math.floor(height / f);
  const out = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = 0; dy < f; dy++) {
        for (let dx = 0; dx < f; dx++) {
          sum += gray[(y * f + dy) * width + x * f + dx];
        }
      }
      out[y * w + x] = sum / (f * f);
    }
  }
  return { gray: out, width: w, height: h };
}

// Γκρι pixel → εικόνα RGBA, όπως τη θέλει η ZXing
function toImage(gray, width, height) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < gray.length; i++) {
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = gray[i];
    rgba[i * 4 + 3] = 255;
  }
  return typeof ImageData !== "undefined"
    ? new ImageData(rgba, width, height)
    : { data: rgba, width, height, colorSpace: "srgb" };
}

// Ένα βήμα: φτιάχνει την παραλλαγή και τη δίνει στη ZXing. Επιστρέφει το κείμενο ή null.
async function tryStep(gray, width, height, step) {
  let image = { gray, width, height };
  if (step.scale > 1) image = shrink(gray, width, height, step.scale);
  let pixels = image.gray;
  if (step.kx > 0) pixels = darkenAlong(pixels, image.width, image.height, step.kx, true);
  if (step.ky > 0) pixels = darkenAlong(pixels, image.width, image.height, step.ky, false);

  try {
    const results = await readBarcodes(toImage(pixels, image.width, image.height), {
      formats: ["QRCode"],
      tryHarder: true,
      maxNumberOfSymbols: 1,
      binarizer: step.binarizer ?? "LocalAverage",
    });
    return results.length > 0 && results[0].text ? results[0].text : null;
  } catch {
    return null;
  }
}

// Η μηχανή του browser, αν υπάρχει (π.χ. Chrome στο Android). Γρήγορη, αλλά όχι παντού διαθέσιμη.
let nativeDetector = null;
async function tryNative(source) {
  if (!("BarcodeDetector" in globalThis)) return null;
  try {
    nativeDetector ??= new BarcodeDetector({ formats: ["qr_code"] });
    const codes = await nativeDetector.detect(source);
    return codes.length > 0 ? codes[0].rawValue : null;
  } catch {
    return null;
  }
}

// Αφήνει τον browser να ζωγραφίσει την οθόνη (π.χ. το "Αναζήτηση QR…") ανάμεσα στις δοκιμές
function letBrowserPaint() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Φωτογραφία: δοκιμάζει όλες τις παραλλαγές μέχρι να βρει QR. Επιστρέφει το κείμενο ή null.
export async function readQr(canvas) {
  const native = await tryNative(canvas);
  if (native !== null) return native;

  const imageData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
  const gray = toGray(imageData);
  for (const step of PHOTO_STEPS) {
    await letBrowserPaint();
    const text = await tryStep(gray, imageData.width, imageData.height, step);
    if (text !== null) return text;
  }
  return null;
}

// Ζωντανή κάμερα: ένα γρήγορο βήμα για ένα καρέ (attempt: ο αύξων αριθμός του καρέ).
export async function decodeFrame(imageData, attempt) {
  const native = await tryNative(imageData);
  if (native !== null) return native;

  const step = FRAME_STEPS[attempt % FRAME_STEPS.length];
  return tryStep(toGray(imageData), imageData.width, imageData.height, step);
}
