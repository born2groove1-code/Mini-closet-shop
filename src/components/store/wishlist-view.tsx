"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchProductsByIds } from "@/lib/actions/cart";
import type { Product } from "@/lib/types";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { ProductGrid, ProductGridSkeleton } from "./product-card";

export function WishlistView() {
  const ids = useWishlistStore((s) => s.ids);
  const { user } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const [loaded, setLoaded] = useState<{ key: string; products: Product[] } | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(",") : [];
    (list.length ? fetchProductsByIds(list) : Promise.resolve([]))
      .then((products) => !cancelled && setLoaded({ key, products }))
      .catch(() => !cancelled && setLoaded({ key, products: [] }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Keep showing cards while a removal re-fetches; filter to current ids.
  const products = (loaded?.products ?? []).filter((p) => ids.includes(p.id));

  if (!loaded) return <ProductGridSkeleton count={4} />;

  return (
    <>
      {!user && ids.length > 0 && (
        <p className="mb-6 rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-700 ring-1 ring-gold-100">
          Your wishlist is saved on this device.{" "}
          <button type="button" className="font-medium underline" onClick={() => openAuth({ mode: "login", redirectTo: "/wishlist" })}>
            Sign in
          </button>{" "}
          to keep it across devices.
        </p>
      )}
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-white">
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any piece you love to save it here."
            action={<Link href="/shop" className="btn btn-primary">Explore the collection</Link>}
          />
        </div>
      )}
    </>
  );
}
