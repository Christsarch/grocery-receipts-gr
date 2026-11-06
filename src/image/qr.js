import jsQR from "jsqr";

export function readQr(canvas) {
  const ctx = canvas.getContext("2d");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const code = jsQR(imageData.data, imageData.width, imageData.height);

  if (code === null) {
    return null;
  }
  return code.data;
}
