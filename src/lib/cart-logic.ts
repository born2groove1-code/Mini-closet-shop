import { MAX_CART_LINES, MAX_QTY_PER_LINE, type Size } from "./constants";
import type { ProductSummary } from "./types";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  category: string;
  size: Size;
  quantity: number;
  /** Last known offer price (display only — the server recomputes at checkout). */
  price: number;
  mrp: number;
  /** Last known stock, used to cap quantities client-side. */
  stock: number;
};

export const cartKey = (productId: string, size: string) => `${productId}::${size}`;

export function maxQuantityFor(stock: number) {
  return Math.max(0, Math.min(MAX_QTY_PER_LINE, stock));
}

/** Total quantity of a product across sizes (stock is tracked per product). */
export function quantityInCart(items: CartItem[], productId: string) {
  return items.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0);
}

export type AddResult = { items: CartItem[]; added: number; reason?: "out-of-stock" | "limit" | "cart-full" };

export function addToCart(items: CartItem[], item: Omit<CartItem, "quantity">, quantity: number): AddResult {
  const requested = Math.max(1, Math.floor(quantity));
  const key = cartKey(item.productId, item.size);
  const existing = items.find((i) => cartKey(i.productId, i.size) === key);
  if (!existing && items.length >= MAX_CART_LINES) return { items, added: 0, reason: "cart-full" };

  const otherSizesQty = quantityInCart(items, item.productId) - (existing?.quantity ?? 0);
  const stockLeft = Math.max(0, item.stock - otherSizesQty);
  const lineMax = maxQuantityFor(stockLeft);
  const current = existing?.quantity ?? 0;
  const next = Math.min(lineMax, current + requested);
  const added = next - current;

  if (added <= 0) {
    return { items, added: 0, reason: item.stock <= 0 || stockLeft <= current ? "out-of-stock" : "limit" };
  }

  const updated: CartItem = { ...item, quantity: next };
  // Keep the latest known stock on every line of the same product.
  const synced = items.map((i) => (i.productId === item.productId ? { ...i, stock: item.stock } : i));
  const nextItems = existing
    ? synced.map((i) => (cartKey(i.productId, i.size) === key ? updated : i))
    : [...synced, updated];
  return { items: nextItems, added, reason: added < requested ? "limit" : undefined };
}

export function setLineQuantity(items: CartItem[], key: string, quantity: number) {
  const target = items.find((i) => cartKey(i.productId, i.size) === key);
  if (!target) return items;
  if (quantity <= 0) return items.filter((i) => cartKey(i.productId, i.size) !== key);
  const otherSizesQty = quantityInCart(items, target.productId) - target.quantity;
  const max = maxQuantityFor(target.stock - otherSizesQty);
  const next = Math.min(Math.floor(quantity), max);
  if (next <= 0) return items.filter((i) => cartKey(i.productId, i.size) !== key);
  return items.map((i) => (cartKey(i.productId, i.size) === key ? { ...i, quantity: next } : i));
}

export type CartNotice = { title: string; message: string };

/**
 * Applies authoritative server data (price, stock, availability) to the cart.
 * Removes unavailable lines and caps quantities to current stock.
 */
export function reconcileCart(items: CartItem[], products: ProductSummary[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const notices: CartNotice[] = [];
  const remainingStock = new Map(products.map((p) => [p.id, p.stock]));
  const next: CartItem[] = [];

  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p || !p.isActive) {
      notices.push({ title: item.title, message: "is no longer available and was removed." });
      continue;
    }
    if (!p.sizes.includes(item.size)) {
      notices.push({ title: p.title, message: `size ${item.size} is no longer offered and was removed.` });
      continue;
    }
    const left = remainingStock.get(p.id) ?? 0;
    const quantity = Math.min(item.quantity, maxQuantityFor(left));
    if (quantity <= 0) {
      notices.push({ title: p.title, message: `(${item.size}) is out of stock and was removed.` });
      continue;
    }
    if (quantity < item.quantity) {
      notices.push({ title: p.title, message: `(${item.size}) quantity reduced to ${quantity} — limited stock.` });
    }
    if (p.price !== item.price) {
      notices.push({
        title: p.title,
        message: `price updated from ₹${item.price.toLocaleString("en-IN")} to ₹${p.price.toLocaleString("en-IN")}.`,
      });
    }
    remainingStock.set(p.id, left - quantity);
    next.push({
      ...item,
      title: p.title,
      slug: p.slug,
      image: p.images[0] ?? null,
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      stock: p.stock,
      quantity,
    });
  }
  return { items: next, notices };
}
