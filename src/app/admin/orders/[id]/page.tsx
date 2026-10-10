import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { OrderUpdateForm } from "@/components/admin/order-update-form";
import {
  OrderItemsList,
  OrderStatusBadge,
  OrderTimeline,
  PaymentStatusBadge,
  ShippingAddress,
} from "@/components/orders/order-bits";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { getOrderById } from "@/lib/data/orders";
import { formatDateTime, formatOrderNumber } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata = { title: "Order details" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const label = formatOrderNumber(order.orderNumber);
  const waCustomer = whatsappLink(
    `Namaste ${order.customerName}, this is Mini Closet regarding your order ${label}.`,
    order.phone,
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-rose-700">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl">{label}</h1>
          <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)} · Order ID {order.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <section className="card p-5">
        <OrderTimeline order={order} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-xl">Items</h2>
            <OrderItemsList order={order} linkProducts={false} />
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-xl">Customer & delivery</h2>
            <ShippingAddress order={order} />
            {order.customerEmail && <p className="mt-2 text-sm text-muted">{order.customerEmail}</p>}
            {order.notes && <p className="mt-3 rounded-xl bg-gold-50 px-3 py-2 text-sm text-gold-700">Customer note: {order.notes}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:+91${order.phone}`} className="btn btn-outline btn-sm"><Phone className="h-4 w-4" /> Call</a>
              {waCustomer && (
                <a href={waCustomer} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#25D366] text-white hover:bg-[#1fb457]">
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp customer
                </a>
              )}
            </div>
          </section>
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-xl">Update order</h2>
            <OrderUpdateForm key={order.updatedAt} order={order} />
          </section>
        </aside>
      </div>
    </div>
  );
}
