export async function fileToCanvas(file, maxSize = 1600) {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

  const newWidth = Math.round(bitmap.width * scale);
  const newHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

  const originalHeight = bitmap.height;
  const originalWidth = bitmap.width;
  bitmap.close();

  return { canvas, originalWidth, originalHeight };
}
