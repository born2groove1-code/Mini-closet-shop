import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import {
  OrderItemsList,
  OrderStatusBadge,
  OrderTimeline,
  PaymentStatusBadge,
  ShippingAddress,
} from "@/components/orders/order-bits";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { requireUser } from "@/lib/auth";
import { getOrderById } from "@/lib/data/orders";
import { STORE } from "@/lib/store-config";
import { formatDateTime, formatOrderNumber } from "@/lib/utils";
import { buildOrderInquiryMessage, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/account/orders/[id]">) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrderById(id);
  // RLS already hides other customers' orders; this also hides admin access here.
  if (!order || order.userId !== user.id) notFound();

  const label = formatOrderNumber(order.orderNumber);
  const wa = whatsappLink(buildOrderInquiryMessage(label));

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-rose-700">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      {placed === "1" && (
        <div className="flex gap-4 rounded-2xl bg-rose-700 p-5 text-white sm:p-6">
          <PartyPopper className="h-7 w-7 shrink-0 text-gold-200" aria-hidden />
          <div>
            <h2 className="text-2xl text-white">Thank you! Your order is placed.</h2>
            <p className="mt-1 text-sm text-white/85">
              Order {label} is <strong>Pending COD Verification</strong>. Our team will call or WhatsApp you on +91{" "}
              {order.phone} to confirm, then dispatch within 1–2 business days. Expected delivery:{" "}
              {STORE.shipping.deliveryWindow}.
            </p>
          </div>
        </div>
      )}

      <section className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl">{label}</h2>
            <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="mt-7">
          <OrderTimeline order={order} />
        </div>
        {order.trackingNumber && (
          <p className="mt-6 rounded-xl bg-ivory-dark px-4 py-3 text-sm">
            Tracking number: <strong className="font-medium">{order.trackingNumber}</strong>
          </p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card p-5 sm:p-7">
          <h3 className="text-xl">Items</h3>
          <OrderItemsList order={order} />
        </section>
        <div className="space-y-6">
          <section className="card p-5 sm:p-7">
            <h3 className="mb-3 text-xl">Delivery address</h3>
            <ShippingAddress order={order} />
            {order.notes && <p className="mt-3 text-sm text-muted">Note: {order.notes}</p>}
          </section>
          <section className="card space-y-3 p-5 sm:p-7">
            <h3 className="text-xl">Need help?</h3>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn w-full bg-[#25D366] text-white hover:bg-[#1fb457]">
                <WhatsAppIcon className="h-5 w-5" /> WhatsApp us about this order
              </a>
            ) : (
              <Link href="/help#contact" className="btn btn-outline w-full">Contact support</Link>
            )}
            {order.status === "pending" && <CancelOrderButton orderId={order.id} />}
          </section>
        </div>
      </div>
    </div>
  );
}
