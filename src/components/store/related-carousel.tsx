"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function RelatedCarousel({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <div className="absolute -top-14 right-0 hidden gap-2 sm:flex">
        <button type="button" onClick={() => scroll(-1)} className="icon-btn border border-line bg-white" aria-label="Scroll left">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => scroll(1)} className="icon-btn border border-line bg-white" aria-label="Scroll right">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:gap-5 sm:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
