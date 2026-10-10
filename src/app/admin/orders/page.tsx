import Link from "next/link";
import { Search } from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-bits";
import { ORDER_STATUS_LABELS, ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { listOrdersForAdmin } from "@/lib/data/orders";
import { cn, formatDateTime, formatINR, formatOrderNumber } from "@/lib/utils";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const statusParam = typeof sp.status === "string" ? sp.status : undefined;
  const status = ORDER_STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : undefined;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const orders = await listOrdersForAdmin({ status, q });

  const tabHref = (s?: OrderStatus) => {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div>
      <p className="eyebrow">Sales</p>
      <h1 className="mt-1 mb-6 text-4xl">Orders</h1>

      <form action="/admin/orders" className="relative mb-4" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input name="q" defaultValue={q} type="search" className="field-input pl-10" placeholder="Order no. (MC-10001), mobile, PIN code or name" aria-label="Search orders" />
      </form>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[undefined, ...ORDER_STATUSES].map((s) => (
          <Link key={s ?? "all"} href={tabHref(s)}
            className={cn("flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm transition",
              status === s ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white hover:border-rose-300")}>
            {s ? ORDER_STATUS_LABELS[s] : "All"}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="card px-6 py-14 text-center text-sm text-muted">No orders found.</p>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="card block p-4 active:bg-rose-50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatOrderNumber(o.orderNumber)}</p>
                      <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
                    </div>
                    <p className="font-semibold">{formatINR(o.total)}</p>
                  </div>
                  <p className="mt-2 text-sm">{o.customerName} · +91 {o.phone}</p>
                  <p className="text-xs text-muted">{o.city}, {o.state} — {o.pincode}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <OrderStatusBadge status={o.status} />
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-ivory text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-rose-50/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-rose-700 hover:underline">{formatOrderNumber(o.orderNumber)}</Link>
                      <p className="text-xs text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      {o.customerName}
                      <p className="text-xs text-muted">+91 {o.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      {o.city}, {o.state}
                      <p className="text-xs text-muted">PIN {o.pincode}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatINR(o.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <OrderStatusBadge status={o.status} />
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
