import { isSupabaseConfigured } from "@/lib/env";

/** Shown only until Supabase environment variables are configured. */
export function PreviewBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="bg-gold-50 text-gold-700 ring-1 ring-gold-200">
      <p className="container-page py-2 text-center text-xs sm:text-sm">
        <strong className="font-medium">Preview mode:</strong> showing the demo catalogue. Add your Supabase keys
        (see README) to enable accounts, checkout and the admin dashboard.
      </p>
    </div>
  );
}
