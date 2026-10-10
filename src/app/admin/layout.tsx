import type { Metadata } from "next";
import Link from "next/link";
import { AdminBottomNav, AdminSidebar } from "@/components/admin/admin-nav";
import { BackendRequired } from "@/components/store/backend-required";
import { Logo } from "@/components/ui/logo";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | Mini Closet" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!isSupabaseConfigured) return <BackendRequired feature="The admin dashboard" />;

  // Defence in depth: the proxy already checked, but every admin render
  // re-verifies with the database (is_admin()) — and RLS guards every query.
  const user = await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-ivory-dark/50">
      <header className="sticky top-0 z-30 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo compact />
            <div className="leading-tight">
              <p className="font-display text-xl font-semibold">Boutique Admin</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <Link href="/" className="btn btn-ghost btn-sm border border-line md:hidden">Store</Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-6 pb-28 sm:px-6 md:pb-10">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
