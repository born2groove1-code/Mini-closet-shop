"use server";

import { z } from "zod";
import { getProductsByIds } from "@/lib/data/products";
import type { Product, ProductSummary } from "@/lib/types";

const idsSchema = z.array(z.guid()).max(100);

/** Authoritative price / stock / availability for items in the bag. */
export async function refreshCartProducts(ids: string[]): Promise<ProductSummary[]> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return [];
  const products = await getProductsByIds(parsed.data);
  return products.map(({ id, slug, title, category, price, mrp, stock, sizes, images, isActive }) => ({
    id,
    slug,
    title,
    category,
    price,
    mrp,
    stock,
    sizes,
    images,
    isActive,
  }));
}

/** Full product cards for the wishlist page (inactive/deleted products are omitted). */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return [];
  const products = await getProductsByIds(parsed.data);
  const order = new Map(parsed.data.map((id, i) => [id, i]));
  return products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
