"use client";

import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { Price } from "@/components/ui/price";
import { StockBadge } from "@/components/ui/stock-badge";
import { useAddToBag } from "@/hooks/use-add-to-bag";
import { categoryLabel, type Size } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn, discountPercent } from "@/lib/utils";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const addToBag = useAddToBag();
  const [choosingSize, setChoosingSize] = useState(false);
  const soldOut = product.stock <= 0;
  const off = discountPercent(product.mrp, product.price);
  const href = `/product/${product.slug}`;

  function handleAdd() {
    if (product.sizes.length === 1) {
      addToBag(product, product.sizes[0]);
    } else {
      setChoosingSize(true);
    }
  }

  function pick(size: Size) {
    if (addToBag(product, size)) setChoosingSize(false);
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory-dark">
        <Link href={href} aria-label={product.title} className="absolute inset-0">
          <ProductImage
            src={product.images[0]}
            alt={product.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className={cn("object-cover transition duration-500 group-hover:scale-[1.03]", soldOut && "opacity-70 grayscale-[35%]")}
          />
        </Link>
        <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-wide text-rose-700 backdrop-blur">
            {categoryLabel(product.category)}
          </span>
          {off > 0 && !soldOut && (
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white">{off}% OFF</span>
          )}
        </div>
        <WishlistButton productId={product.id} title={product.title} className="absolute top-2.5 right-2.5" />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5">
          <StockBadge stock={product.stock} />
        </div>

        {choosingSize && (
          <div className="absolute inset-x-0 bottom-0 animate-slide-up border-t border-line bg-white/95 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-muted uppercase">Select size</span>
              <button type="button" onClick={() => setChoosingSize(false)} className="text-muted hover:text-charcoal" aria-label="Close size picker">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => pick(size)}
                  className="min-h-9 min-w-10 rounded-full border border-line px-3 text-sm font-medium transition hover:border-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-sans text-[15px] leading-snug font-medium text-charcoal">
          <Link href={href} className="line-clamp-2 hover:text-rose-700">
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 hidden text-[13px] leading-relaxed text-muted sm:block">{product.description}</p>
        <Price price={product.price} mrp={product.mrp} size="sm" className="mt-2" />
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className={cn("btn btn-sm mt-3 w-full", soldOut ? "btn-ghost border border-line" : "btn-outline")}
        >
          {soldOut ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden /> Add to Bag
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="skeleton aspect-[3/4] rounded-none" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-2/5" />
            <div className="skeleton mt-3 h-9 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
