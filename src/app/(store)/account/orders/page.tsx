import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-bits";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/ui/product-image";
import { requireUser } from "@/lib/auth";
import { listMyOrders } from "@/lib/data/orders";
import { formatDateTime, formatINR, formatOrderNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Order history", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listMyOrders(user.id);

  if (!orders.length) {
    return (
      <div className="card">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When you place an order it will appear here with live status updates."
          action={<Link href="/shop" className="btn btn-primary">Shop Collection</Link>}
        />
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`} className="card flex flex-col gap-4 p-4 transition hover:border-rose-200 hover:shadow-soft sm:flex-row sm:items-center sm:p-5">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((i) => (
                <span key={i.id} className="relative h-16 w-12 overflow-hidden rounded-lg bg-ivory-dark ring-2 ring-white">
                  <ProductImage src={i.productImage} alt="" fill sizes="48px" className="object-cover" />
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{formatOrderNumber(o.orderNumber)}</p>
              <p className="text-sm text-muted">
                {formatDateTime(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s) · {formatINR(o.total)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={o.status} />
              <PaymentStatusBadge status={o.paymentStatus} />
              <ChevronRight className="hidden h-5 w-5 text-muted sm:block" aria-hidden />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
