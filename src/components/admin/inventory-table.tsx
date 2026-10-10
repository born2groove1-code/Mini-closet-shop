"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Minus, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ProductImage } from "@/components/ui/product-image";
import { Spinner } from "@/components/ui/spinner";
import { StockBadge } from "@/components/ui/stock-badge";
import { adjustStock, deleteProduct, setProductFlag, setStock } from "@/lib/actions/admin-products";
import { CATEGORIES, categoryLabel, LOW_STOCK_THRESHOLD } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";
import { useUIStore } from "@/stores/ui";

type StockFilter = "all" | "low" | "out" | "hidden";

export function InventoryTable({ products: initial }: { products: Product[] }) {
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const [products, setProducts] = useState(initial);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [seen, setSeen] = useState(initial);

  // Server re-render (router.refresh) → take the fresh list.
  if (initial !== seen) {
    setSeen(initial);
    setProducts(initial);
  }

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (stockFilter === "low" && !(p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)) return false;
      if (stockFilter === "out" && p.stock > 0) return false;
      if (stockFilter === "hidden" && p.isActive) return false;
      return !needle || p.title.toLowerCase().includes(needle) || p.slug.includes(needle);
    });
  }, [products, q, category, stockFilter]);

  const patch = (id: string, changes: Partial<Product>) =>
    setProducts((list) => list.map((p) => (p.id === id ? { ...p, ...changes } : p)));

  async function run(id: string, task: () => Promise<void>) {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await task();
    } finally {
      setBusy((b) => ({ ...b, [id]: false }));
    }
  }

  function bump(p: Product, delta: number) {
    void run(p.id, async () => {
      const res = await adjustStock(p.id, delta);
      if (res.ok) patch(p.id, { stock: res.data.stock });
      else toast({ tone: "error", title: res.error });
    });
  }

  function commitStock(p: Product) {
    const raw = drafts[p.id];
    if (raw === undefined) return;
    setDrafts((d) => {
      const next = { ...d };
      delete next[p.id];
      return next;
    });
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      toast({ tone: "error", title: "Stock must be a whole number of 0 or more" });
      return;
    }
    if (value === p.stock) return;
    void run(p.id, async () => {
      const res = await setStock(p.id, value);
      if (res.ok) {
        patch(p.id, { stock: res.data.stock });
        toast({ tone: "success", title: `Stock set to ${res.data.stock}`, description: p.title });
      } else toast({ tone: "error", title: res.error });
    });
  }

  function flag(p: Product, key: "isFeatured" | "isActive") {
    const value = !p[key];
    patch(p.id, { [key]: value });
    void run(p.id, async () => {
      const res = await setProductFlag(p.id, key, value);
      if (!res.ok) {
        patch(p.id, { [key]: !value });
        toast({ tone: "error", title: res.error });
      }
    });
  }

  async function doDelete() {
    const p = confirmDelete;
    if (!p) return;
    await run(p.id, async () => {
      const res = await deleteProduct(p.id);
      if (res.ok) {
        setProducts((list) => list.filter((x) => x.id !== p.id));
        toast({ tone: "success", title: "Product deleted", description: p.title });
        router.refresh();
      } else toast({ tone: "error", title: res.error });
    });
    setConfirmDelete(null);
  }

  const chip = (active: boolean) =>
    cn("min-h-9 shrink-0 rounded-full border px-3 text-sm transition", active ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white hover:border-rose-300");

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quick search products…" className="field-input pl-10" aria-label="Search inventory" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button type="button" className={chip(category === "all")} onClick={() => setCategory("all")}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.slug} type="button" className={chip(category === c.slug)} onClick={() => setCategory(c.slug)}>{c.label}</button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" aria-hidden />
          {([["all", "Any stock"], ["low", "Low stock"], ["out", "Out of stock"], ["hidden", "Hidden"]] as const).map(([v, l]) => (
            <button key={v} type="button" className={chip(stockFilter === v)} onClick={() => setStockFilter(v)}>{l}</button>
          ))}
        </div>
        <p className="text-sm text-muted">{visible.length} of {products.length} products</p>
      </div>

      {visible.length === 0 ? (
        <p className="card px-6 py-12 text-center text-sm text-muted">No products match. Try a different search or filter.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => {
            const draft = drafts[p.id];
            return (
              <li key={p.id} className={cn("card flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4", !p.isActive && "bg-ivory-dark/60")}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative h-20 w-15 shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                    <ProductImage src={p.images[0]} alt="" fill sizes="60px" className="object-cover" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="text-xs text-muted">{categoryLabel(p.category)} · {formatINR(p.price)} <span className="line-through">{p.mrp > p.price ? formatINR(p.mrp) : ""}</span></p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <StockBadge stock={p.stock} />
                      {!p.isActive && <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] text-stone-700">Hidden</span>}
                      {p.isFeatured && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[11px] text-gold-700">Featured</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <div className="flex items-center rounded-full border border-line bg-white" role="group" aria-label={`Stock for ${p.title}`}>
                    <button type="button" onClick={() => bump(p, -1)} disabled={busy[p.id] || p.stock <= 0} className="flex h-11 w-11 items-center justify-center rounded-l-full hover:bg-rose-50 disabled:opacity-35" aria-label="Decrease stock">
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={draft ?? String(p.stock)}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      onBlur={() => commitStock(p)}
                      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                      className="h-11 w-14 border-x border-line text-center font-medium tabular-nums focus:outline-none"
                      aria-label="Stock quantity"
                    />
                    <button type="button" onClick={() => bump(p, 1)} disabled={busy[p.id]} className="flex h-11 w-11 items-center justify-center rounded-r-full hover:bg-rose-50 disabled:opacity-35" aria-label="Increase stock">
                      {busy[p.id] ? <Spinner /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center">
                    <button type="button" onClick={() => flag(p, "isFeatured")} className={cn("icon-btn", p.isFeatured && "text-gold-600")} aria-pressed={p.isFeatured} aria-label={p.isFeatured ? "Unfeature" : "Feature on homepage"} title="Featured">
                      <Star className={cn("h-5 w-5", p.isFeatured && "fill-current")} />
                    </button>
                    <button type="button" onClick={() => flag(p, "isActive")} className="icon-btn" aria-pressed={p.isActive} aria-label={p.isActive ? "Hide from store" : "Show in store"} title={p.isActive ? "Visible" : "Hidden"}>
                      {p.isActive ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5 text-muted" />}
                    </button>
                    <Link href={`/admin/products/${p.id}/edit`} className="icon-btn" aria-label={`Edit ${p.title}`}>
                      <Pencil className="h-5 w-5" />
                    </Link>
                    <button type="button" onClick={() => setConfirmDelete(p)} className="icon-btn hover:text-danger" aria-label={`Delete ${p.title}`}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete product">
        <h2 className="text-2xl">Delete this product?</h2>
        <p className="mt-2 text-sm text-muted">
          <strong className="text-charcoal">{confirmDelete?.title}</strong> and its photos will be removed permanently. Past orders keep
          their own copy of the title and price. Tip: hide it instead if you may restock later.
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1 border border-line">Cancel</button>
          <button type="button" onClick={() => void doDelete()} disabled={confirmDelete ? busy[confirmDelete.id] : false} className="btn flex-1 bg-danger text-white hover:bg-danger/90">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
