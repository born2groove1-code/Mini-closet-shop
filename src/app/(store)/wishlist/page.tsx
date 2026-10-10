import type { Metadata } from "next";
import { WishlistView } from "@/components/store/wishlist-view";

export const metadata: Metadata = { title: "My Wishlist" };

export default function WishlistPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-1 mb-8 text-4xl sm:text-5xl">My Wishlist</h1>
      <WishlistView />
    </div>
  );
}
