"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { buildShopHref, PRICE_PRESETS, SORT_OPTIONS, type CatalogFilters, type SortOption } from "@/lib/catalog";
import { CATEGORIES, type CategorySlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Live catalogue filters. Every change updates the URL (shareable, back-button
 * friendly) and the server re-renders the grid without a full page load.
 */
export function ShopFilters({
  filters,
  resultCount,
  children,
}: {
  filters: CatalogFilters;
  resultCount: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(filters.q ?? "");
  const [min, setMin] = useState(filters.min?.toString() ?? "");
  const [max, setMax] = useState(filters.max?.toString() ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const latest = useRef(filters);
  const [seenHref, setSeenHref] = useState(() => buildShopHref(filters));
  const [appliedHref, setAppliedHref] = useState(seenHref);

  // URL changed by something other than this panel (e.g. header search or a
  // category link): sync the text inputs. Adjusting state during render is
  // React's recommended alternative to an effect here.
  const href = buildShopHref(filters);
  if (href !== seenHref) {
    setSeenHref(href);
    if (href !== appliedHref) {
      setAppliedHref(href);
      setQ(filters.q ?? "");
      setMin(filters.min?.toString() ?? "");
      setMax(filters.max?.toString() ?? "");
    }
  }

  useEffect(() => {
    latest.current = filters;
  }, [filters]);

  function apply(patch: Partial<CatalogFilters>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    const target = buildShopHref(next);
    setAppliedHref(target);
    startTransition(() => router.replace(target, { scroll: false }));
  }

  // Debounced live filtering for typed inputs.
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = q.trim() || undefined;
      const minN = min === "" ? undefined : Math.max(0, Math.floor(Number(min)));
      const maxN = max === "" ? undefined : Math.max(0, Math.floor(Number(max)));
      const cur = latest.current;
      if (trimmed !== cur.q || minN !== cur.min || maxN !== cur.max) {
        if ((minN !== undefined && Number.isNaN(minN)) || (maxN !== undefined && Number.isNaN(maxN))) return;
        apply({ q: trimmed, min: minN, max: maxN });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, min, max]);

  const activeCount =
    (filters.category ? 1 : 0) + (filters.q ? 1 : 0) + (filters.min !== undefined || filters.max !== undefined ? 1 : 0) + (filters.inStock ? 1 : 0);

  function clearAll() {
    setQ("");
    setMin("");
    setMax("");
    latest.current = {};
    setAppliedHref("/shop");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  const chip = (active: boolean) =>
    cn(
      "min-h-10 rounded-full border px-4 text-sm transition",
      active ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white hover:border-rose-300 hover:text-rose-700",
    );

  const panel = (
    <div className="space-y-7">
      <div>
        <label htmlFor="shop-q" className="field-label">Search</label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="shop-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or category" className="field-input pl-10" />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Category</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(!filters.category)} onClick={() => apply({ category: undefined })}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.slug} type="button" className={chip(filters.category === c.slug)}
              onClick={() => apply({ category: filters.category === c.slug ? undefined : (c.slug as CategorySlug) })}>
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">Price range (₹)</legend>
        <div className="flex items-center gap-2">
          <input type="number" inputMode="numeric" min={0} value={min} onChange={(e) => setMin(e.target.value)} placeholder="Min" className="field-input" aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <input type="number" inputMode="numeric" min={0} value={max} onChange={(e) => setMax(e.target.value)} placeholder="Max" className="field-input" aria-label="Maximum price" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const active = filters.min === p.min && filters.max === p.max;
            return (
              <button key={p.label} type="button" className={cn(chip(active), "min-h-9 px-3 text-xs")}
                onClick={() => {
                  setMin(active || p.min === undefined ? "" : String(p.min));
                  setMax(active || p.max === undefined ? "" : String(p.max));
                  apply(active ? { min: undefined, max: undefined } : { min: p.min, max: p.max });
                }}>
                {p.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={Boolean(filters.inStock)} onChange={(e) => apply({ inStock: e.target.checked || undefined })}
          className="h-5 w-5 rounded border-line accent-rose-600" />
        Show in-stock items only
      </label>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="btn btn-ghost btn-sm -ml-3 text-rose-700">
          <X className="h-4 w-4" /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[264px_1fr] lg:gap-8">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-40 rounded-2xl border border-line bg-white p-5">{panel}</div>
      </aside>

      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
            {pending && <Spinner className="text-rose-600" label="Updating results" />}
            {resultCount} {resultCount === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSheetOpen(true)} className="btn btn-sm border border-line bg-white lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeCount > 0 && <span className="rounded-full bg-rose-600 px-1.5 text-xs text-white">{activeCount}</span>}
            </button>
            <label htmlFor="shop-sort" className="sr-only">Sort by</label>
            <select id="shop-sort" value={filters.sort ?? "featured"} onChange={(e) => apply({ sort: e.target.value as SortOption })}
              className="h-9 rounded-full border border-line bg-white px-3 text-sm focus:border-rose-600 focus:outline-none">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={cn("transition-opacity", pending && "opacity-60")}>{children}</div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 animate-fade-in bg-charcoal/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-slide-up overflow-y-auto rounded-t-3xl bg-ivory p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl">Filters</h2>
              <button type="button" className="icon-btn" onClick={() => setSheetOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <button type="button" onClick={() => setSheetOpen(false)} className="btn btn-primary mt-6 w-full">
              Show {resultCount} {resultCount === 1 ? "result" : "results"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
