import { CATEGORIES, isCategorySlug, type CategorySlug } from "./constants";
import type { Product } from "./types";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export type CatalogFilters = {
  category?: CategorySlug;
  q?: string;
  min?: number;
  max?: number;
  sort?: SortOption;
  inStock?: boolean;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function parseAmount(v: string | undefined) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/** Keeps search text to letters, digits, spaces and hyphens (safe for PostgREST filters). */
export function sanitizeSearch(q: string | undefined) {
  if (!q) return undefined;
  const clean = q.normalize("NFKC").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return clean || undefined;
}

export function parseCatalogParams(params: RawParams): CatalogFilters {
  const category = first(params.category);
  const sort = first(params.sort);
  return {
    category: isCategorySlug(category) ? category : undefined,
    q: sanitizeSearch(first(params.q)),
    min: parseAmount(first(params.min)),
    max: parseAmount(first(params.max)),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortOption) : undefined,
    inStock: first(params.inStock) === "1" ? true : undefined,
  };
}

/** Categories whose name matches the search text, e.g. "sarees" -> saree. */
export function categoriesMatching(q: string): CategorySlug[] {
  const needle = q.toLowerCase().replace(/[\s-]/g, "");
  if (needle.length < 3) return [];
  return CATEGORIES.filter((c) =>
    [c.slug, c.label, c.plural].some((name) => {
      const hay = name.toLowerCase().replace(/[\s-]/g, "");
      return hay.includes(needle) || needle.includes(hay);
    }),
  ).map((c) => c.slug);
}

export function sortProducts(products: Product[], sort: SortOption = "featured") {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "newest":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return list.sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt),
      );
  }
}

/** In-memory equivalent of the Supabase catalogue query (used in preview mode and tests). */
export function filterProducts(products: Product[], f: CatalogFilters) {
  const q = f.q?.toLowerCase();
  const qCategories = q ? categoriesMatching(q) : [];
  const filtered = products.filter((p) => {
    if (!p.isActive) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.min !== undefined && p.price < f.min) return false;
    if (f.max !== undefined && p.price > f.max) return false;
    if (f.inStock && p.stock <= 0) return false;
    if (q && !p.title.toLowerCase().includes(q) && !qCategories.includes(p.category)) return false;
    return true;
  });
  return sortProducts(filtered, f.sort);
}

export function buildShopHref(f: CatalogFilters) {
  const sp = new URLSearchParams();
  if (f.category) sp.set("category", f.category);
  if (f.q) sp.set("q", f.q);
  if (f.min !== undefined) sp.set("min", String(f.min));
  if (f.max !== undefined) sp.set("max", String(f.max));
  if (f.sort && f.sort !== "featured") sp.set("sort", f.sort);
  if (f.inStock) sp.set("inStock", "1");
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export const PRICE_PRESETS = [
  { label: "Under ₹1,000", min: undefined, max: 999 },
  { label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { label: "₹2,000 – ₹3,999", min: 2000, max: 3999 },
  { label: "₹4,000 & above", min: 4000, max: undefined },
] as const;
