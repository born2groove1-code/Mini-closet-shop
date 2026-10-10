"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, Truck, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { CATEGORIES } from "@/lib/constants";
import { STORE } from "@/lib/store-config";
import { cn } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { AccountMenu } from "./account-menu";
import { SearchBar } from "./search-bar";

function CategoryLinks({ onNavigate, vertical = false }: { onNavigate?: () => void; vertical?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/shop" ? params.get("category") : null;
  const links = [{ slug: null, label: "All" }, ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.label }))];

  return (
    <>
      {links.map((c) => {
        const active = pathname === "/shop" && current === c.slug;
        return (
          <Link
            key={c.label}
            href={c.slug ? `/shop?category=${c.slug}` : "/shop"}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative transition-colors",
              vertical
                ? "flex min-h-12 items-center border-b border-line text-lg font-display"
                : "py-3 text-[13px] font-medium tracking-[0.14em] uppercase after:absolute after:inset-x-0 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-rose-600 after:transition hover:text-rose-700 hover:after:scale-x-100",
              active && (vertical ? "text-rose-700" : "text-rose-700 after:scale-x-100"),
            )}
          >
            {c.label === "All" && !vertical ? "All Collection" : c.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const openCart = useUIStore((s) => s.openCart);
  const count = useCartStore(selectCartCount);
  const cartHydrated = useCartStore((s) => s.hydrated);
  const wishCount = useWishlistStore((s) => s.ids.length);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-rose-700 text-white">
        <p className="container-page flex min-h-9 items-center justify-center gap-2 text-center text-[12px] tracking-wide sm:text-[13px]">
          <Truck className="h-3.5 w-3.5 shrink-0 text-gold-200" aria-hidden />
          <span>
            <strong className="font-medium">{STORE.shipping.headline}</strong>
            <span className="hidden sm:inline"> · Cash on Delivery · Free shipping above ₹999</span>
          </span>
        </p>
      </div>

      <div className="border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85">
        <div className="container-page flex h-16 items-center gap-2 sm:h-[72px] sm:gap-4">
          <button type="button" className="icon-btn -ml-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <Logo className="mr-auto lg:mr-0" />

          <Suspense fallback={null}>
            <SearchBar className="mx-auto hidden w-full max-w-md md:block" key={pathname} />
          </Suspense>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button type="button" className="icon-btn md:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="Search" aria-expanded={searchOpen}>
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" strokeWidth={1.75} />}
            </button>
            <Link href="/wishlist" className="icon-btn relative" aria-label={`Wishlist (${wishCount})`}>
              <Heart className="h-5 w-5" strokeWidth={1.75} />
              {wishCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-500 px-1 text-[10px] font-semibold text-charcoal">
                  {wishCount}
                </span>
              )}
            </Link>
            <AccountMenu />
            <button type="button" onClick={openCart} className="icon-btn relative" aria-label={`Open bag (${count} items)`}>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
              {cartHydrated && count > 0 && (
                <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="container-page pb-3 md:hidden">
            <SearchBar autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        )}

        <nav aria-label="Categories" className="hidden border-t border-line/70 lg:block">
          <div className="container-page flex items-center justify-center gap-10">
            <Suspense fallback={null}>
              <CategoryLinks />
            </Suspense>
            <Link href="/help" className="py-3 text-[13px] font-medium tracking-[0.14em] text-muted uppercase hover:text-rose-700">
              Help
            </Link>
          </div>
        </nav>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-charcoal/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-ivory p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="eyebrow mt-8 mb-2">Shop by category</p>
            <nav className="flex flex-col" aria-label="Mobile categories">
              <Suspense fallback={null}>
                <CategoryLinks vertical onNavigate={() => setMenuOpen(false)} />
              </Suspense>
            </nav>
            <div className="mt-auto space-y-1 pt-6 text-sm">
              <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3">
                <Heart className="h-4 w-4 text-rose-600" /> Wishlist
              </Link>
              <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3">
                <ShoppingBag className="h-4 w-4 text-rose-600" /> My orders
              </Link>
              <Link href="/help" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-3">
                <Truck className="h-4 w-4 text-rose-600" /> Shipping, returns & help
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
