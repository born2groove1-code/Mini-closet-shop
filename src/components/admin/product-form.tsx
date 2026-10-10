"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";
import { saveProduct } from "@/lib/actions/admin-products";
import { CATEGORIES, SIZES, type CategorySlug, type Size } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn, discountPercent } from "@/lib/utils";
import { fieldErrors, productSchema } from "@/lib/validation";
import { useUIStore } from "@/stores/ui";
import { ImageUploader } from "./image-uploader";

type FormState = {
  title: string;
  category: CategorySlug | "";
  mrp: string;
  price: string;
  stock: string;
  sizes: Size[];
  description: string;
  details: string;
  fabric: string;
  care: string;
  isFeatured: boolean;
  isActive: boolean;
};

const toNumber = (v: string) => (v.trim() === "" ? Number.NaN : Number(v));

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [form, setForm] = useState<FormState>({
    title: product?.title ?? "",
    category: product?.category ?? "",
    mrp: product ? String(product.mrp) : "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "1",
    sizes: product?.sizes ?? [],
    description: product?.description ?? "",
    details: product?.details ?? "",
    fabric: product?.fabric ?? "",
    care: product?.care ?? "",
    isFeatured: product?.isFeatured ?? false,
    isActive: product?.isActive ?? true,
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function toggleSize(size: Size) {
    update("sizes", form.sizes.includes(size) ? form.sizes.filter((s) => s !== size) : SIZES.filter((s) => s === size || form.sizes.includes(s)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const input = {
      ...form,
      category: form.category as CategorySlug,
      mrp: toNumber(form.mrp),
      price: toNumber(form.price),
      stock: toNumber(form.stock),
      images,
    };
    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      toast({ tone: "error", title: "Please fix the highlighted fields" });
      return;
    }
    setSaving(true);
    const res = await saveProduct(product?.id ?? null, input);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast({ tone: "error", title: res.error });
      return;
    }
    toast({ tone: "success", title: product ? "Product updated" : "Product added", description: form.title });
    router.push("/admin/products");
    router.refresh();
  }

  const err = (k: string) => errors[k]?.[0];
  const off = discountPercent(toNumber(form.mrp), toNumber(form.price));

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="text-xl">Photos</h2>
          <p className="mb-4 text-sm text-muted">Snap directly with your phone camera or pick from the gallery.</p>
          <ImageUploader images={images} onChange={setImages} onBusyChange={setUploading} />
          {err("images") && <p className="field-error">{err("images")}</p>}
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="text-xl">Product details</h2>
          <div>
            <label htmlFor="p-title" className="field-label">Title *</label>
            <input id="p-title" className="field-input" value={form.title} onChange={(e) => update("title", e.target.value)} aria-invalid={Boolean(err("title"))} placeholder="e.g. Rani Pink Chikankari Kurti" />
            {err("title") && <p className="field-error">{err("title")}</p>}
          </div>
          <fieldset>
            <legend className="field-label">Category *</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((c) => (
                <button key={c.slug} type="button" onClick={() => update("category", c.slug)} aria-pressed={form.category === c.slug}
                  className={cn("min-h-11 rounded-xl border text-sm font-medium transition", form.category === c.slug ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white hover:border-rose-300")}>
                  {c.label}
                </button>
              ))}
            </div>
            {err("category") && <p className="field-error">{err("category")}</p>}
          </fieldset>
          <div>
            <label htmlFor="p-desc" className="field-label">Short description</label>
            <textarea id="p-desc" rows={3} maxLength={500} className="field-input resize-none" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="One or two lines shown on the product card" />
            <p className="mt-1 text-right text-xs text-muted">{form.description.length}/500</p>
          </div>
          <details className="group rounded-xl border border-line p-4" open={Boolean(product?.details || product?.fabric)}>
            <summary className="cursor-pointer text-sm font-medium">Fabric, care & long description (optional)</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="p-fabric" className="field-label">Fabric</label>
                <input id="p-fabric" className="field-input" value={form.fabric} onChange={(e) => update("fabric", e.target.value)} placeholder="e.g. Pure cotton" />
              </div>
              <div>
                <label htmlFor="p-care" className="field-label">Care instructions</label>
                <input id="p-care" className="field-input" value={form.care} onChange={(e) => update("care", e.target.value)} placeholder="e.g. Hand wash cold, dry in shade" />
              </div>
              <div>
                <label htmlFor="p-details" className="field-label">Detailed description</label>
                <textarea id="p-details" rows={4} className="field-input" value={form.details} onChange={(e) => update("details", e.target.value)} />
              </div>
            </div>
          </details>
        </section>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="text-xl">Price & stock</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="p-mrp" className="field-label">MRP (₹) *</label>
              <input id="p-mrp" type="number" inputMode="decimal" min={0} className="field-input" value={form.mrp} onChange={(e) => update("mrp", e.target.value)} aria-invalid={Boolean(err("mrp"))} />
              {err("mrp") && <p className="field-error">{err("mrp")}</p>}
            </div>
            <div>
              <label htmlFor="p-price" className="field-label">Offer price (₹) *</label>
              <input id="p-price" type="number" inputMode="decimal" min={0} className="field-input" value={form.price} onChange={(e) => update("price", e.target.value)} aria-invalid={Boolean(err("price"))} />
              {err("price") && <p className="field-error">{err("price")}</p>}
            </div>
          </div>
          {off > 0 && <p className="text-sm text-success">Customers see {off}% off</p>}
          <div>
            <label htmlFor="p-stock" className="field-label">Stock quantity *</label>
            <input id="p-stock" type="number" inputMode="numeric" min={0} step={1} className="field-input" value={form.stock} onChange={(e) => update("stock", e.target.value)} aria-invalid={Boolean(err("stock"))} />
            {err("stock") ? <p className="field-error">{err("stock")}</p> : form.stock === "0" && <p className="mt-1.5 text-xs text-gold-700">Will show as “Out of Stock”.</p>}
          </div>
          <fieldset>
            <legend className="field-label">Available sizes *</legend>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s} type="button" onClick={() => toggleSize(s)} aria-pressed={form.sizes.includes(s)}
                  className={cn("min-h-11 min-w-12 rounded-full border px-4 text-sm font-medium transition", form.sizes.includes(s) ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white hover:border-rose-300")}>
                  {s}
                </button>
              ))}
            </div>
            {err("sizes") && <p className="field-error">{err("sizes")}</p>}
          </fieldset>
        </section>

        <section className="card space-y-1 p-5 sm:p-6">
          <h2 className="mb-2 text-xl">Visibility</h2>
          <Toggle label="Featured item" hint="Show in the homepage Featured Collection" checked={form.isFeatured} onChange={(v) => update("isFeatured", v)} />
          <Toggle label="Visible in store" hint="Turn off to hide without deleting" checked={form.isActive} onChange={(v) => update("isActive", v)} />
        </section>

        <div className="flex gap-3">
          <Link href="/admin/products" className="btn btn-ghost flex-1 border border-line">Cancel</Link>
          <button type="submit" className="btn btn-primary flex-[2]" disabled={saving || uploading}>
            {(saving || uploading) && <Spinner />}
            {uploading ? "Uploading photos…" : product ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-xs text-muted">{hint}</span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-line transition peer-checked:bg-rose-600 peer-focus-visible:ring-2 peer-focus-visible:ring-gold-500" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
