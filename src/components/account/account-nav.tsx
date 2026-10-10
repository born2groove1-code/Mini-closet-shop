"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, KeyRound, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Order history", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/update-password", label: "Change password", icon: KeyRound },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-2 overflow-x-auto scrollbar-none lg:flex-col lg:gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-3 rounded-full px-4 text-sm transition lg:rounded-xl",
              active ? "bg-rose-600 text-white" : "border border-line bg-white hover:border-rose-300 lg:border-transparent lg:bg-transparent lg:hover:bg-white",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
