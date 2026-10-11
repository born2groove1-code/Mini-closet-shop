import { STORE } from "./store-config";

/**
 * Public runtime configuration. NEXT_PUBLIC_* values are inlined at build
 * time, so they must be referenced statically (no dynamic property access).
 *
 * SUPABASE_SERVICE_ROLE_KEY is deliberately never read by the app: every
 * request runs as the signed-in user so Row-Level Security stays in charge.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || STORE.whatsapp).replace(/\D/g, ""),
};

/** False until Supabase credentials are provided; the store then runs in read-only preview mode. */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
