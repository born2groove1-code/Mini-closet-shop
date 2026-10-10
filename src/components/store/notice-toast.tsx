"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useUIStore } from "@/stores/ui";

const NOTICES: Record<string, { title: string; description?: string; tone: "info" | "error" | "success" }> = {
  "admin-only": {
    tone: "error",
    title: "Admins only",
    description: "That area is reserved for Mini Closet admins.",
  },
  "email-confirmed": {
    tone: "success",
    title: "E-mail confirmed",
    description: "Welcome to Mini Closet! You're signed in.",
  },
  "auth-error": {
    tone: "error",
    title: "That link has expired",
    description: "Please sign in again or request a new link.",
  },
  "password-updated": { tone: "success", title: "Password updated" },
};

/** Turns `?notice=` redirects (from the proxy / auth callback) into a toast, then cleans the URL. */
export function NoticeToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const notice = params.get("notice");

  useEffect(() => {
    if (!notice || !NOTICES[notice]) return;
    toast(NOTICES[notice]);
    const next = new URLSearchParams(params);
    next.delete("notice");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [notice, params, pathname, router, toast]);

  return null;
}
