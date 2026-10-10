import Link from "next/link";
import { BackendRequired } from "@/components/store/backend-required";
import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  if (!isSupabaseConfigured) return <BackendRequired feature="Your account" />;
  const user = await requireUser("/account");

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-rose-700">Home</Link> <span aria-hidden>/</span>{" "}
        <span className="text-charcoal">My account</span>
      </nav>
      <div className="mt-3 mb-8">
        <p className="eyebrow">My account</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Namaste, {user.fullName?.split(" ")[0] ?? "there"}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
