"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogIn, LogOut, Package, User, UserPlus, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/ui";

export function AccountMenu() {
  const { user, isAdmin } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const toast = useUIStore((s) => s.toast);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setOpen(false);
    await getSupabaseBrowserClient().auth.signOut();
    toast({ tone: "success", title: "Signed out", description: "See you again soon!" });
    router.push("/");
    router.refresh();
  }

  const item = "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-rose-50 hover:text-rose-700";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? "Account menu" : "Sign in or create account"}
      >
        {user ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm font-medium text-white">
            {(user.fullName ?? user.email).charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound className="h-5 w-5" strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 animate-fade-in rounded-2xl border border-line bg-white p-2 shadow-lift">
          {user ? (
            <>
              <div className="border-b border-line px-3 pt-2 pb-3">
                <p className="truncate text-sm font-medium">{user.fullName ?? "Welcome"}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <div className="pt-1">
                <Link role="menuitem" href="/account" className={item} onClick={() => setOpen(false)}>
                  <User className="h-4 w-4" /> My profile
                </Link>
                <Link role="menuitem" href="/account/orders" className={item} onClick={() => setOpen(false)}>
                  <Package className="h-4 w-4" /> Order history
                </Link>
                {isAdmin && (
                  <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                  </Link>
                )}
                <button role="menuitem" type="button" onClick={signOut} className={item}>
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="px-3 pt-2 pb-2 text-sm text-muted">Sign in to track orders and save your wishlist.</p>
              <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); openAuth({ mode: "login" }); }}>
                <LogIn className="h-4 w-4" /> Sign in
              </button>
              <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); openAuth({ mode: "signup" }); }}>
                <UserPlus className="h-4 w-4" /> Create account
              </button>
              <Link role="menuitem" href="/account/orders" className={item} onClick={() => setOpen(false)}>
                <Package className="h-4 w-4" /> Order history
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
