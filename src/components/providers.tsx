"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, type ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/types";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";

type AuthContextValue = { user: SessionUser | null; isAdmin: boolean };

const AuthContext = createContext<AuthContextValue>({ user: null, isAdmin: false });

export function useAuth() {
  return use(AuthContext);
}

/**
 * Client-side app state. The user comes from the server (verified JWT) and is
 * refreshed through router.refresh() whenever Supabase reports a change.
 * `isAdmin` only toggles UI links — every admin route/action is re-checked
 * on the server and by RLS.
 */
export function Providers({
  user,
  isAdmin,
  children,
}: {
  user: SessionUser | null;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const serverUserId = useRef(user?.id ?? null);

  useEffect(() => {
    serverUserId.current = user?.id ?? null;
  }, [user?.id]);

  // Persisted stores are hydrated after mount to avoid SSR hydration mismatches.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextId = session?.user?.id ?? null;
      if (event === "INITIAL_SESSION") return;
      if (nextId !== serverUserId.current || event === "USER_UPDATED") {
        serverUserId.current = nextId;
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext value={{ user, isAdmin }}>
      <WishlistSync userId={user?.id ?? null} />
      {children}
    </AuthContext>
  );
}

/** Loads the signed-in customer's wishlist and merges any items saved as a guest. */
function WishlistSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      await useWishlistStore.persist.rehydrate();
      const store = useWishlistStore.getState();

      if (!userId || !isSupabaseConfigured) {
        // Signed out: drop the previous account's list, keep a guest list.
        if (store.userId) store.setFromServer(null, []);
        return;
      }
      const supabase = getSupabaseBrowserClient();
      const guestIds = store.userId ? [] : store.ids;
      if (guestIds.length) {
        await supabase
          .from("wishlist_items")
          .upsert(
            guestIds.map((product_id) => ({ user_id: userId, product_id })),
            { onConflict: "user_id,product_id", ignoreDuplicates: true },
          );
      }
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("product_id")
        .order("created_at", { ascending: false });
      if (cancelled || error) return;
      store.setFromServer(
        userId,
        (data as { product_id: string }[]).map((r) => r.product_id),
      );
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return null;
}
