"use client";

import { useCallback } from "react";
import { useAuth } from "@/components/providers";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";

/** Wishlist state; persisted to the database (RLS: own rows only) for signed-in customers. */
export function useWishlist() {
  const { user } = useAuth();
  const ids = useWishlistStore((s) => s.ids);
  const toast = useUIStore((s) => s.toast);

  const toggle = useCallback(
    async (productId: string, title: string) => {
      const added = useWishlistStore.getState().toggleLocal(productId);
      toast({
        tone: "success",
        title: added ? "Saved to wishlist" : "Removed from wishlist",
        description: added && !user ? `${title} — sign in to keep it on every device.` : title,
      });
      if (!user || !isSupabaseConfigured) return;

      const supabase = getSupabaseBrowserClient();
      const { error } = added
        ? await supabase
            .from("wishlist_items")
            .upsert(
              { user_id: user.id, product_id: productId },
              { onConflict: "user_id,product_id", ignoreDuplicates: true },
            )
        : await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) {
        useWishlistStore.getState().toggleLocal(productId); // revert
        toast({ tone: "error", title: "Could not update your wishlist", description: "Please try again." });
      }
    },
    [toast, user],
  );

  return { ids, has: (id: string) => ids.includes(id), toggle };
}
