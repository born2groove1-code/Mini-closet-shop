import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/** Rendered by account/checkout/admin pages while Supabase is not configured. */
export function BackendRequired({ feature }: { feature: string }) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-line bg-white">
        <EmptyState
          icon={DatabaseZap}
          title="Connect Supabase to continue"
          description={
            <>
              {feature} needs the store backend. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your environment, run the SQL migration, and redeploy.
              See the README for the step-by-step guide.
            </>
          }
          action={<Link href="/shop" className="btn btn-primary">Browse the collection</Link>}
        />
      </div>
    </div>
  );
}
