import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { ProfileForm } from "@/components/account/profile-form";
import { OrderStatusBadge } from "@/components/orders/order-bits";
import { requireUser } from "@/lib/auth";
import { getMyProfile, listMyOrders } from "@/lib/data/orders";
import { formatDate, formatINR, formatOrderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [profile, orders] = await Promise.all([getMyProfile(user.id), listMyOrders(user.id)]);
  const recent = orders.slice(0, 3);

  return (
    <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
      <section className="card p-5 sm:p-7" aria-labelledby="profile-title">
        <h2 id="profile-title" className="text-2xl">Profile & default address</h2>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <ProfileForm profile={profile} />
      </section>

      <section className="card p-5 sm:p-7" aria-labelledby="recent-title">
        <div className="flex items-center justify-between">
          <h2 id="recent-title" className="text-2xl">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-rose-700 hover:underline">View all</Link>
        </div>
        {recent.length ? (
          <ul className="mt-4 divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-rose-700">
                  <span>
                    <span className="block text-sm font-medium">{formatOrderNumber(o.orderNumber)}</span>
                    <span className="text-xs text-muted">{formatDate(o.createdAt)} · {formatINR(o.total)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 flex flex-col items-center py-6 text-center text-sm text-muted">
            <Package className="mb-3 h-8 w-8 text-rose-300" aria-hidden />
            No orders yet.
            <Link href="/shop" className="btn btn-outline btn-sm mt-4">Start shopping</Link>
          </div>
        )}
      </section>
    </div>
  );
}
