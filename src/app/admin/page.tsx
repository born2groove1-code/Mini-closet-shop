import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, IndianRupee, PackageX, PlusCircle, Truck } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-bits";
import { ProductImage } from "@/components/ui/product-image";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { getDashboardStats, listOrdersForAdmin } from "@/lib/data/orders";
import { listAllProductsForAdmin } from "@/lib/data/products";
import { formatDateTime, formatINR, formatOrderNumber } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [stats, orders, products] = await Promise.all([
    getDashboardStats(),
    listOrdersForAdmin({}),
    listAllProductsForAdmin(),
  ]);
  const recent = orders.slice(0, 6);
  const lowStock = products.filter((p) => p.isActive && p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock);

  const cards = [
    { label: "Pending verification", value: stats.pendingOrders, icon: Clock, href: "/admin/orders?status=pending", tone: "text-gold-700 bg-gold-50" },
    { label: "To ship / in transit", value: stats.openOrders, icon: Truck, href: "/admin/orders?status=confirmed", tone: "text-sky-800 bg-sky-50" },
    { label: "Orders today", value: stats.ordersToday, icon: ArrowRight, href: "/admin/orders", tone: "text-rose-700 bg-rose-50" },
    { label: "Revenue (excl. cancelled)", value: formatINR(stats.revenue), icon: IndianRupee, href: "/admin/orders", tone: "text-emerald-800 bg-emerald-50" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-1 text-4xl">Dashboard</h1>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <PlusCircle className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, tone }) => (
          <Link key={label} href={href} className="card p-4 transition hover:shadow-soft sm:p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted sm:text-sm">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-rose-700 hover:underline">All orders</Link>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-rose-700">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{formatOrderNumber(o.orderNumber)} · {o.customerName}</span>
                      <span className="text-xs text-muted">{formatDateTime(o.createdAt)} · {o.city} {o.pincode}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium">{formatINR(o.total)}</span>
                      <OrderStatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">No orders yet. Share your store link on WhatsApp & Instagram!</p>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl"><AlertTriangle className="h-5 w-5 text-gold-600" /> Low stock</h2>
            <Link href="/admin/products" className="text-sm font-medium text-rose-700 hover:underline">Inventory</Link>
          </div>
          {lowStock.length ? (
            <ul className="divide-y divide-line">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3 py-2.5 hover:text-rose-700">
                    <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-ivory-dark">
                      <ProductImage src={p.images[0]} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                    {p.stock === 0 ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-danger"><PackageX className="h-3.5 w-3.5" /> Out</span>
                    ) : (
                      <span className="text-xs font-medium text-gold-700">{p.stock} left</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">All products are well stocked.</p>
          )}
        </section>
      </div>
    </div>
  );
}
