"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  title,
  className,
  variant = "floating",
}: {
  productId: string;
  title: string;
  className?: string;
  variant?: "floating" | "inline";
}) {
  const { has, toggle } = useWishlist();
  const active = has(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(productId, title);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      className={cn(
        "flex items-center justify-center transition",
        variant === "floating"
          ? "h-10 w-10 rounded-full bg-white/90 shadow-soft backdrop-blur hover:scale-105"
          : "h-11 w-11 rounded-full border border-line bg-white hover:border-rose-300",
        className,
      )}
    >
      <Heart
        className={cn("h-[18px] w-[18px] transition", active ? "fill-rose-600 text-rose-600" : "text-charcoal")}
        strokeWidth={1.75}
      />
    </button>
  );
}
