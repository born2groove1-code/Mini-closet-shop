"use client";

import Image, { type ImageProps } from "next/image";
import { Shirt } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "src" | "alt"> & { src: string | null | undefined; alt: string };

/** next/image with graceful fallback; local SVG illustrations skip the optimiser. */
export function ProductImage({ src, alt, className, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-center gap-2 bg-ivory-dark text-gold-600",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <Shirt className="h-10 w-10" strokeWidth={1.25} aria-hidden />
        <span className="text-xs tracking-[0.2em] uppercase">Mini Closet</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      unoptimized={src.endsWith(".svg")}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
