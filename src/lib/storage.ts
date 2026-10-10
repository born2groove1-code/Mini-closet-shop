import { PRODUCT_IMAGE_BUCKET } from "./constants";
import { env } from "./env";

export function publicImageUrl(path: string) {
  return `${env.supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/** Returns the object path for images stored in our bucket, or null for other URLs (e.g. seed SVGs). */
export function storagePathFromPublicUrl(url: string, supabaseUrl: string = env.supabaseUrl) {
  if (!supabaseUrl) return null;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}
