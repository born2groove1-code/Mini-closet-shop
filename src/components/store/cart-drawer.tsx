"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers";
import { ProductImage } from "@/components/ui/product-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Spinner } from "@/components/ui/spinner";
import { refreshCartProducts } from "@/lib/actions/cart";
import { cartKey, maxQuantityFor, quantityInCart } from "@/lib/cart-logic";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { amountToFreeShipping, calculateTotals } from "@/lib/pricing";
import { formatINR } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen);
  const close = useUIStore((s) => s.closeCart);
  const openAuth = useUIStore((s) => s.openAuth);
  const toast = useUIStore((s) => s.toast);
  const items = useCartStore((s) => s.items);
  const count = useCartStore(selectCartCount);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const reconcile = useCartStore((s) => s.reconcile);
  const { user } = useAuth();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const openCount = useUIStore((s) => s.cartOpenCount);
  const [syncedCount, setSyncedCount] = useState(0);
  const syncing = open && items.length > 0 && syncedCount !== openCount;

  const { subtotal, shipping, total } = calculateTotals(items);
  const remaining = amountToFreeShipping(subtotal);

  // Revalidate prices & stock with the server each time the bag opens.
  useEffect(() => {
    if (!open) return;
    const ids = [...new Set(useCartStore.getState().items.map((i) => i.productId))];
    if (!ids.length) return;
    let cancelled = false;
    refreshCartProducts(ids)
      .then((products) => {
        if (cancelled) return;
        for (const n of reconcile(products)) toast({ tone: "info", title: n.title, description: n.message });
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setSyncedCount(openCount));
    return () => {
      cancelled = true;
    };
  }, [open, openCount, reconcile, toast]);

  // Esc to close, lock page scroll, move focus into the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  function checkout() {
    if (!isSupabaseConfigured) {
      toast({ tone: "info", title: "Preview mode", description: "Connect Supabase to enable sign-in and checkout." });
      return;
    }
    if (user) {
      close();
      router.push("/checkout");
    } else {
      // Inline login/signup — the bag stays in local storage throughout.
      openAuth({ redirectTo: "/checkout", reason: "Sign in or create an account to check out. Your bag is saved." });
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <div className="absolute inset-0 animate-fade-in bg-charcoal/40 backdrop-blur-[2px]" onClick={close} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in-right flex-col bg-ivory shadow-2xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl">Your Bag</h2>
            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
              {count} {count === 1 ? "item" : "items"}
            </span>
            {syncing && <Spinner className="text-gold-600" label="Checking latest prices" />}
          </div>
          <button type="button" onClick={close} className="icon-btn" aria-label="Close bag">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <ShoppingBag className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-display">Your bag is empty</p>
            <p className="mt-2 text-sm text-muted">Discover kurtis, suits, sarees and cord sets made for every occasion.</p>
            <Link href="/shop" onClick={close} className="btn btn-primary mt-6">
              Shop Collection
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line bg-white px-5 py-3">
              <p className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-gold-600" aria-hidden />
                {remaining > 0 ? (
                  <span>
                    Add <strong>{formatINR(remaining)}</strong> more for free shipping
                  </span>
                ) : (
                  <span className="text-success">You&apos;ve unlocked free shipping across India!</span>
                )}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ivory-dark">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => {
                const key = cartKey(item.productId, item.size);
                const otherQty = quantityInCart(items, item.productId) - item.quantity;
                const max = maxQuantityFor(item.stock - otherQty);
                return (
                  <li key={key} className="flex gap-4 py-4">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={close}
                      className="relative h-28 w-21 shrink-0 overflow-hidden rounded-xl bg-ivory-dark"
                    >
                      <ProductImage src={item.image} alt={item.title} fill sizes="84px" className="object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/product/${item.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium hover:text-rose-700">
                          {item.title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(key)}
                          className="-mt-1 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-rose-50 hover:text-danger"
                          aria-label={`Remove ${item.title} (${item.size})`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">Size: {item.size}</p>
                      {item.stock <= 4 && <p className="mt-0.5 text-xs text-gold-700">Only {item.stock} left</p>}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          max={Math.max(item.quantity, max)}
                          onChange={(q) => setQuantity(key, q)}
                          label={`Quantity for ${item.title}`}
                        />
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatINR(item.price * item.quantity)}</p>
                          {item.mrp > item.price && (
                            <p className="text-xs text-muted line-through">{formatINR(item.mrp * item.quantity)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-line bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{formatINR(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd>{shipping === 0 ? <span className="text-success">Free</span> : formatINR(shipping)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatINR(total)}</dd>
                </div>
              </dl>
              <button type="button" onClick={checkout} className="btn btn-primary mt-4 w-full">
                <Lock className="h-4 w-4" aria-hidden /> Checkout
              </button>
              <p className="mt-2 text-center text-xs text-muted">Cash on Delivery available · Prices confirmed at checkout</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
