"use client";

import { CheckCircle2, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { StockBadge } from "@/components/ui/stock-badge";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useAddToBag } from "@/hooks/use-add-to-bag";
import { maxQuantityFor, quantityInCart } from "@/lib/cart-logic";
import { categoryLabel, LOW_STOCK_THRESHOLD, type Size } from "@/lib/constants";
import { STORE } from "@/lib/store-config";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { buildProductInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { WishlistButton } from "./wishlist-button";

export function PurchasePanel({ product }: { product: Product }) {
  const addToBag = useAddToBag();
  const setInquiry = useUIStore((s) => s.setInquiry);
  const items = useCartStore((s) => s.items);
  const [size, setSize] = useState<Size | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  // Real-time stock validation against what's already in the bag.
  const inBag = quantityInCart(items, product.id);
  const available = Math.max(0, product.stock - inBag);
  const maxQty = Math.max(1, maxQuantityFor(available));
  const soldOut = product.stock <= 0;
  const allInBag = !soldOut && available <= 0;
  const qty = Math.min(quantity, maxQty);

  // Feed the floating WhatsApp button with this product + chosen size.
  useEffect(() => {
    setInquiry({ productName: product.title, size });
    return () => setInquiry(null);
  }, [product.title, size, setInquiry]);

  function onAdd() {
    if (!size) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (addToBag(product, size, qty)) setQuantity(1);
  }

  const waHref = whatsappLink(buildProductInquiryMessage(product.title, size));

  return (
    <div>
      <p className="eyebrow">{categoryLabel(product.category)}</p>
      <h1 className="mt-2 text-4xl leading-tight sm:text-[2.6rem]">{product.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.description}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Price price={product.price} mrp={product.mrp} size="lg" />
        <StockBadge stock={product.stock} />
      </div>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes · MRP shown with strike-through</p>

      <fieldset id="size-picker" className="mt-7 scroll-mt-40">
        <legend className="mb-3 flex w-full items-center justify-between text-sm font-medium">
          <span>
            Select size {size && <span className="font-normal text-muted">— {size}</span>}
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSize(s);
                setSizeError(false);
              }}
              aria-pressed={size === s}
              disabled={soldOut}
              className={cn(
                "min-h-11 min-w-12 rounded-full border px-4 text-sm font-medium transition disabled:opacity-40",
                size === s ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white hover:border-rose-400",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        {sizeError && <p className="field-error" role="alert">Please select a size.</p>}
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} max={maxQty} onChange={(v) => setQuantity(Math.max(1, v))} />
        {!soldOut && available > 0 && available <= LOW_STOCK_THRESHOLD && (
          <span className="text-sm text-gold-700">Only {available} available</span>
        )}
        {inBag > 0 && (
          <span className="flex items-center gap-1 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" /> {inBag} in your bag
          </span>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onAdd} disabled={soldOut || allInBag} className="btn btn-primary flex-1">
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {soldOut ? "Out of Stock" : allInBag ? "All available pieces in bag" : "Add to Bag"}
        </button>
        <WishlistButton productId={product.id} title={product.title} variant="inline" />
      </div>

      {waHref ? (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn mt-3 w-full border border-[#25D366]/40 bg-[#25D366]/5 text-[#128C4B] hover:bg-[#25D366]/10">
          <WhatsAppIcon className="h-5 w-5" /> Ask about this on WhatsApp
        </a>
      ) : null}

      <div className="mt-7 rounded-2xl border border-line bg-white p-4 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Truck className="h-4 w-4 text-gold-600" aria-hidden /> {STORE.shipping.headline}
        </p>
        <p className="mt-1 text-muted">
          Delivered in {STORE.shipping.deliveryWindow}. Cash on Delivery available. Free shipping on orders of ₹999+.
        </p>
      </div>
    </div>
  );
}
