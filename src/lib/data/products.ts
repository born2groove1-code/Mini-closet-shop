import "server-only";
import { cache } from "react";
import { filterProducts, sortProducts, categoriesMatching, type CatalogFilters } from "@/lib/catalog";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { mapProduct, PRODUCT_COLUMNS, type ProductRow } from "./mappers";

const CATALOG_LIMIT = 120;

export class DataError extends Error {}

function fail(context: string, error: { message: string }): never {
  console.error(`[data] ${context}:`, error.message);
  throw new DataError(`Could not load ${context}. Please try again.`);
}

export async function listProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  if (!isSupabaseConfigured) return filterProducts(DEMO_PRODUCTS, filters);

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products").select(PRODUCT_COLUMNS).eq("is_active", true);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.min !== undefined) query = query.gte("price", filters.min);
  if (filters.max !== undefined) query = query.lte("price", filters.max);
  if (filters.inStock) query = query.gt("stock", 0);
  if (filters.q) {
    // filters.q is sanitised to letters/digits/spaces/hyphens by parseCatalogParams.
    const cats = categoriesMatching(filters.q);
    const titleFilter = `title.ilike.%${filters.q}%`;
    query = cats.length ? query.or(`${titleFilter},category.in.(${cats.join(",")})`) : query.ilike("title", `%${filters.q}%`);
  }

  switch (filters.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(CATALOG_LIMIT);
  if (error) fail("products", error);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getFeaturedProducts(limit = 8) {
  const products = await listProducts({ sort: "featured" });
  const featured = products.filter((p) => p.isFeatured);
  return (featured.length ? featured : products).slice(0, limit);
}

export async function getNewArrivals(limit = 8) {
  return (await listProducts({ sort: "newest" })).slice(0, limit);
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!isSupabaseConfigured) return DEMO_PRODUCTS.find((p) => p.slug === slug && p.isActive) ?? null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) fail("product", error);
  return data ? mapProduct(data as ProductRow) : null;
});

export async function getRelatedProducts(product: Product, limit = 8) {
  const sameCategory = await listProducts({ category: product.category, sort: "featured" });
  const related = sameCategory.filter((p) => p.id !== product.id);
  if (related.length >= 4) return related.slice(0, limit);
  const others = (await listProducts({ sort: "featured" })).filter(
    (p) => p.id !== product.id && p.category !== product.category,
  );
  return [...related, ...others].slice(0, limit);
}

/** Active products by id (cart revalidation, wishlist). Unknown/inactive ids are omitted. */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids)].slice(0, 100);
  if (!unique.length) return [];
  if (!isSupabaseConfigured) return DEMO_PRODUCTS.filter((p) => unique.includes(p.id) && p.isActive);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .in("id", unique)
    .eq("is_active", true);
  if (error) fail("products", error);
  return (data as ProductRow[]).map(mapProduct);
}

export async function searchProducts(q: string, limit = 6) {
  return (await listProducts({ q, sort: "featured" })).slice(0, limit);
}

/* ----------------------------- Admin queries ----------------------------- */

/** All products including inactive ones (RLS only returns them to admins). */
export async function listAllProductsForAdmin(): Promise<Product[]> {
  if (!isSupabaseConfigured) return sortProducts(DEMO_PRODUCTS, "newest");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) fail("inventory", error);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductByIdForAdmin(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) fail("product", error);
  return data ? mapProduct(data as ProductRow) : null;
}
