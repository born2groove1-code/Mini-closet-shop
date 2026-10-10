"use client";

import { AlertCircle, Camera, ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGES_PER_PRODUCT, PRODUCT_IMAGE_BUCKET } from "@/lib/constants";
import { env } from "@/lib/env";
import { extensionFor, prepareImageForUpload, validateImageFile } from "@/lib/image-utils";
import { publicImageUrl, storagePathFromPublicUrl } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Upload = { id: string; name: string; preview: string; progress: number; error?: string };

/** Uploads straight to Supabase Storage with progress (XHR); storage RLS allows admins only. */
function uploadWithProgress(path: string, blob: Blob, token: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    xhr.open("POST", `${env.supabaseUrl}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${encoded}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", env.supabaseAnonKey);
    xhr.setRequestHeader("Content-Type", blob.type);
    xhr.setRequestHeader("Cache-Control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = `Upload failed (${xhr.status})`;
      try {
        message = (JSON.parse(xhr.responseText) as { message?: string }).message ?? message;
      } catch {
        /* keep default */
      }
      reject(new Error(xhr.status === 403 ? "Not allowed — admin access required." : message));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(blob);
  });
}

export function ImageUploader({
  images,
  onChange,
  onBusyChange,
}: {
  images: string[];
  onChange: Dispatch<SetStateAction<string[]>>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Images uploaded during this editing session (safe to delete immediately).
  const sessionUploads = useRef(new Set<string>());
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES_PER_PRODUCT - images.length - uploads.filter((u) => !u.error).length;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError(null);
    const files = Array.from(fileList).slice(0, Math.max(0, remaining));
    if (fileList.length > files.length) setError(`You can add up to ${MAX_IMAGES_PER_PRODUCT} photos per product.`);

    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    onBusyChange?.(true);
    await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID();
        const preview = URL.createObjectURL(file);
        const update = (patch: Partial<Upload>) =>
          setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
        setUploads((list) => [...list, { id, name: file.name, preview, progress: 0 }]);

        if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
          update({ error: "Only JPEG, PNG or WebP" });
          return;
        }
        try {
          const blob = await prepareImageForUpload(file);
          const check = validateImageFile({ type: blob.type || file.type, size: blob.size, name: file.name });
          if (!check.ok) {
            update({ error: "Larger than 5 MB" });
            return;
          }
          const now = new Date();
          const path = `products/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${id}.${extensionFor(blob.type || file.type)}`;
          await uploadWithProgress(path, blob, token, (progress) => update({ progress }));
          const url = publicImageUrl(path);
          sessionUploads.current.add(url);
          onChange((prev) => [...prev, url]);
          setUploads((list) => list.filter((u) => u.id !== id));
          URL.revokeObjectURL(preview);
        } catch (e) {
          update({ error: e instanceof Error ? e.message : "Upload failed" });
        }
      }),
    );
    onBusyChange?.(false);
  }

  async function removeImage(url: string) {
    onChange((prev) => prev.filter((i) => i !== url));
    // Freshly uploaded and never saved: delete now. Saved images are deleted
    // by the server only after the product is saved without them.
    if (sessionUploads.current.has(url)) {
      sessionUploads.current.delete(url);
      const path = storagePathFromPublicUrl(url);
      if (path) await getSupabaseBrowserClient().storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src, i) => (
          <figure key={src} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-ivory-dark">
            <ProductImage src={src} alt={`Product photo ${i + 1}`} fill sizes="160px" className="object-cover" />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                <Star className="h-3 w-3 fill-current" /> Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 disabled:opacity-40" aria-label="Move photo left">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 disabled:opacity-40" aria-label="Move photo right">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={() => void removeImage(src)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-danger" aria-label="Delete photo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </figure>
        ))}

        {uploads.map((u) => (
          <figure key={u.id} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-ivory-dark">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={u.preview} alt={`Uploading ${u.name}`} className={cn("h-full w-full object-cover", !u.error && "opacity-60")} />
            <div className="absolute inset-x-2 bottom-2">
              {u.error ? (
                <div className="flex items-start gap-1 rounded-lg bg-white/95 p-1.5 text-[11px] text-danger">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="flex-1">{u.error}</span>
                  <button type="button" onClick={() => setUploads((l) => l.filter((x) => x.id !== u.id))} className="font-medium underline">
                    OK
                  </button>
                </div>
              ) : (
                <div className="h-1.5 overflow-hidden rounded-full bg-white/70" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                  <div className="h-full bg-rose-600 transition-all" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </div>
          </figure>
        ))}

        {remaining > 0 && (
          <>
            <button type="button" onClick={() => cameraInput.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 text-rose-700 transition hover:border-rose-400">
              <Camera className="h-7 w-7" />
              <span className="text-xs font-medium">Take photo</span>
            </button>
            <button type="button" onClick={() => fileInput.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-white text-muted transition hover:border-rose-300 hover:text-rose-700">
              <ImagePlus className="h-7 w-7" />
              <span className="text-xs font-medium">Choose files</span>
            </button>
          </>
        )}
      </div>

      <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1}
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }} aria-label="Take a product photo" />
      <input ref={fileInput} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} multiple className="sr-only" tabIndex={-1}
        onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }} aria-label="Choose product photos" />

      <p className="mt-2 text-xs text-muted">
        JPEG, PNG or WebP · max 5 MB each (large camera photos are resized automatically) · up to {MAX_IMAGES_PER_PRODUCT} photos. The first photo is the cover.
      </p>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
