import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

/**
 * Landing URL for Supabase e-mail links (sign-up confirmation, password reset).
 * Supports both the PKCE `code` flow and the `token_hash` e-mail template flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"), "/");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!isSupabaseConfigured) return NextResponse.redirect(new URL("/", origin));

  const supabase = await createSupabaseServerClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (!ok) {
    const failed = new URL("/login", origin);
    failed.searchParams.set("notice", "auth-error");
    return NextResponse.redirect(failed);
  }

  const destination = new URL(type === "recovery" ? "/account/update-password" : next, origin);
  if (type !== "recovery" && !destination.pathname.startsWith("/account/update-password")) {
    destination.searchParams.set("notice", "email-confirmed");
  }
  return NextResponse.redirect(destination);
}
