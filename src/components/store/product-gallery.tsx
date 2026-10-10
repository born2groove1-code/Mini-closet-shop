"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

/** Swipeable (scroll-snap) gallery on mobile, thumbnails + arrows on larger screens. */
export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const list = images.length ? images : [""];
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  function goTo(i: number) {
    const next = (i + list.length) % list.length;
    setIndex(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none md:w-20 md:flex-col md:overflow-visible" role="tablist" aria-label="Product images">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show image ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border-2 transition md:w-full",
                i === index ? "border-rose-600" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1">
        <div
          ref={trackRef}
          className="flex aspect-[3/4] snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl border border-line bg-ivory-dark scrollbar-none"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== index) setIndex(i);
          }}
        >
          {list.map((src, i) => (
            <div key={`${src}-${i}`} className="relative h-full w-full shrink-0 snap-center">
              <ProductImage
                src={src}
                alt={`${title} — image ${i + 1} of ${list.length}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {list.length > 1 && (
          <>
            <button type="button" onClick={() => goTo(index - 1)} aria-label="Previous image"
              className="absolute top-1/2 left-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-soft hover:bg-white md:flex">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => goTo(index + 1)} aria-label="Next image"
              className="absolute top-1/2 right-3 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-soft hover:bg-white md:flex">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
              {list.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-rose-600" : "w-1.5 bg-white/90")} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
