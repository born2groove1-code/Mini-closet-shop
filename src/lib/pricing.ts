import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "./constants";

export type PricedLine = { price: number; quantity: number };

/** Client-side estimate. The `place_order` SQL function computes the authoritative totals. */
export function calculateTotals(lines: PricedLine[]) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { subtotal, shipping, total: subtotal + shipping };
}

export function amountToFreeShipping(subtotal: number) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}
