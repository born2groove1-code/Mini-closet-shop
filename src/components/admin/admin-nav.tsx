"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PlusCircle, ShoppingCart, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Inventory", icon: Package },
  { href: "/admin/products/new", label: "Add", icon: PlusCircle },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/products") return pathname === "/admin/products" || /\/admin\/products\/[^/]+\/edit/.test(pathname);
  return pathname.startsWith(href);
}

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="hidden w-56 shrink-0 flex-col gap-1 md:flex">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn("flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition",
            isActive(pathname, href) ? "bg-rose-600 text-white" : "hover:bg-white")}>
          <Icon className="h-4 w-4" /> {label === "Add" ? "Add product" : label}
        </Link>
      ))}
      <Link href="/" className="mt-4 flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm text-muted hover:bg-white">
        <Store className="h-4 w-4" /> View store
      </Link>
    </nav>
  );
}

/** Thumb-friendly bottom bar for the boutique owner's phone. */
export function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
            isActive(pathname, href) ? "text-rose-700" : "text-muted")}>
          <Icon className={cn("h-5 w-5", href === "/admin/products/new" && "h-6 w-6 text-rose-600")} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
