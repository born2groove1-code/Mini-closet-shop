import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

/**
 * Current user from the verified JWT (getClaims validates the signature,
 * unlike getSession). Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const fullName = claims.user_metadata?.full_name;
  return {
    id: claims.sub,
    email: claims.email ?? "",
    fullName: typeof fullName === "string" && fullName ? fullName : null,
  };
});

/** Admin status straight from the database (`is_admin()` — allowlist + confirmed e-mail). */
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const user = await getSessionUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
});

export async function requireUser(nextPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (!(await getIsAdmin())) redirect("/?notice=admin-only");
  return user;
}

export class AuthError extends Error {}

/** For Server Actions: throws instead of redirecting. RLS still enforces every write. */
export async function assertAdmin() {
  if (!isSupabaseConfigured) throw new AuthError("Connect Supabase to use the admin dashboard.");
  const user = await getSessionUser();
  if (!user) throw new AuthError("Please sign in again.");
  if (!(await getIsAdmin())) throw new AuthError("Only boutique admins can do that.");
  return { user, supabase: await createSupabaseServerClient() };
}
