import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/** Supabase client for Client Components. Session lives in cookies shared with the server. */
export function getSupabaseBrowserClient() {
  // createBrowserClient returns a singleton in the browser.
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
