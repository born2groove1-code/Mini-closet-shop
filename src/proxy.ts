import { type NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

const SIGNED_IN_ONLY = ["/account", "/checkout"];

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  const { supabase, userId, response } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const needsUser = isAdminRoute || SIGNED_IN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (needsUser && !userId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(login, response());
  }

  if (isAdminRoute) {
    // Authoritative check in the database (allowlist + confirmed e-mail).
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin !== true) {
      const home = new URL("/", request.url);
      home.searchParams.set("notice", "admin-only");
      return redirectWithCookies(home, response());
    }
  }

  return response();
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation files.
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image|products/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
