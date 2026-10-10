"use client";

import { useCallback } from "react";
import type { Size } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";

export function useAddToBag() {
  const add = useCartStore((s) => s.add);
  const openCart = useUIStore((s) => s.openCart);
  const toast = useUIStore((s) => s.toast);

  return useCallback(
    (product: Pick<Product, "id" | "slug" | "title" | "images" | "category" | "price" | "mrp" | "stock">, size: Size, quantity = 1) => {
      const result = add(
        {
          productId: product.id,
          slug: product.slug,
          title: product.title,
          image: product.images[0] ?? null,
          category: product.category,
          size,
          price: product.price,
          mrp: product.mrp,
          stock: product.stock,
        },
        quantity,
      );

      if (result.added === 0) {
        toast({
          tone: "error",
          title: result.reason === "cart-full" ? "Your bag is full" : "No more stock available",
          description:
            result.reason === "cart-full"
              ? "Please check out or remove an item first."
              : `You already have all available pieces of ${product.title} in your bag.`,
        });
        return false;
      }
      if (result.reason === "limit") {
        toast({
          tone: "info",
          title: `Added ${result.added} to bag`,
          description: "Quantity limited by available stock.",
        });
      }
      openCart();
      return true;
    },
    [add, openCart, toast],
  );
}
