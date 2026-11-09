// Ζωντανή σάρωση QR με την κάμερα, όπως οι εφαρμογές σάρωσης του κινητού.
// Αντί για μία φωτογραφία, εξετάζει συνεχώς καρέ από το βίντεο: όσο ο χρήστης κουνάει λίγο το κινητό
// και η κάμερα εστιάζει, κάποιο καρέ θα βγει καθαρό. Γι' αυτό πετυχαίνει πολύ πιο συχνά.
import { useEffect, useRef, useState } from "react";
import { decodeFrame } from "../image/qr.js";

// Πόσο συχνά εξετάζουμε καρέ (ms). Αρκετά γρήγορα για να φαίνεται άμεσο, αρκετά αργά για να μη ζεσταίνεται το κινητό.
const FRAME_INTERVAL = 120;

export default function QrScanner({ onResult, onCancel }) {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  // Κρατάμε την onResult σε ref: έτσι η κάμερα δεν ξαναξεκινάει κάθε φορά που ξαναζωγραφίζεται η σελίδα
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    let stream = null;
    let stopped = false;
    let timer = null;
    let attempt = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" }, // η πίσω κάμερα
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        setError(
          "Δεν υπάρχει πρόσβαση στην κάμερα. Δώσε άδεια στον browser, ή χρησιμοποίησε τη φωτογραφία.",
        );
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      scanNextFrame();
    }

    async function scanNextFrame() {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        // Εξετάζουμε μόνο το κεντρικό τετράγωνο (εκεί που δείχνει το πλαίσιο): λιγότερα pixel, πιο γρήγορα
        const side = Math.min(video.videoWidth, video.videoHeight) * 0.8;
        const sx = (video.videoWidth - side) / 2;
        const sy = (video.videoHeight - side) / 2;
        const size = Math.min(900, Math.round(side));
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const text = await decodeFrame(imageData, attempt);
        attempt++;
        if (text !== null && !stopped) {
          stopped = true;
          stream?.getTracks().forEach((track) => track.stop());
          if (navigator.vibrate) navigator.vibrate(80);
          onResultRef.current(text);
          return;
        }
      }
      timer = setTimeout(scanNextFrame, FRAME_INTERVAL);
    }

    start();

    // Όταν κλείνει ο σαρωτής: σταματάμε την κάμερα (αλλιώς μένει αναμμένη)
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="scanner">
      {error ? (
        <p className="muted">{error}</p>
      ) : (
        <div className="scanner-view">
          <video ref={videoRef} playsInline muted />
          <div className="scanner-frame" />
        </div>
      )}
      <p className="muted scanner-hint">
        Βάλε το QR μέσα στο πλαίσιο. Αν δεν το πιάνει, πλησίασε ή απομακρύνσου λίγο.
      </p>
      <button type="button" onClick={onCancel}>
        Ακύρωση
      </button>
    </div>
  );
}
