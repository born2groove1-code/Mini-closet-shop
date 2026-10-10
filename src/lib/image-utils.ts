import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "./constants";

export type ImageCheck = { ok: true } | { ok: false; error: string };

export function validateImageFile(file: { type: string; size: number; name?: string }): ImageCheck {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: `${file.name ?? "File"}: only JPEG, PNG or WebP images are allowed.` };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `${file.name ?? "File"}: image is larger than 5 MB.` };
  }
  return { ok: true };
}

export function extensionFor(type: string) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

/** Fits width/height inside a square box of `max` px, preserving aspect ratio. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

const MAX_EDGE = 1800;

/**
 * Browser-only: downsizes large phone-camera photos (often 8–12 MB) before
 * upload so they pass the 5 MB limit and load fast for shoppers.
 * Small images that are already within limits are uploaded untouched.
 */
export async function prepareImageForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const needsResize = Math.max(bitmap.width, bitmap.height) > MAX_EDGE || file.size > MAX_IMAGE_BYTES;
  if (!needsResize) {
    bitmap.close();
    return file;
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outType = file.type === "image/png" ? "image/webp" : file.type;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outType, 0.86));
  return blob ?? file;
}
