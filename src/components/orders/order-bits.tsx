import Link from "next/link";
import { Check, Circle, X } from "lucide-react";
import { ProductImage } from "@/components/ui/product-image";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import type { Order } from "@/lib/types";
import { cn, formatDateTime, formatINR } from "@/lib/utils";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-gold-50 text-gold-700 ring-gold-200",
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  shipped: "bg-violet-50 text-violet-800 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1", STATUS_STYLES[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone =
    status === "paid"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "pending_cod_verification" || status === "pending"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-stone-100 text-stone-600 ring-stone-200";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1", tone)}>
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
        <X className="h-4 w-4" aria-hidden />
        Cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ""}. Any reserved stock has been released.
      </div>
    );
  }
  const steps: { key: OrderStatus; label: string; at: string | null }[] = [
    { key: "pending", label: "Order placed", at: order.createdAt },
    { key: "confirmed", label: "Confirmed", at: order.confirmedAt },
    { key: "shipped", label: "Shipped", at: order.shippedAt },
    { key: "delivered", label: "Delivered", at: order.deliveredAt },
  ];
  const currentIndex = steps.findIndex((s) => s.key === order.status);

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {steps.map((s, i) => {
        const done = i <= currentIndex;
        return (
          <li key={s.key} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span className={cn("absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2", i <= currentIndex ? "bg-rose-600" : "bg-line")} aria-hidden />
            )}
            <span className={cn("relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2", done ? "border-rose-600 bg-rose-600 text-white" : "border-line bg-white text-line")}>
              {done ? <Check className="h-4 w-4" /> : <Circle className="h-2.5 w-2.5 fill-current" />}
            </span>
            <span className={cn("mt-2 text-xs font-medium", done ? "text-charcoal" : "text-muted")}>{s.label}</span>
            {s.at && done && <span className="mt-0.5 hidden text-[11px] text-muted sm:block">{formatDateTime(s.at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItemsList({ order, linkProducts = true }: { order: Order; linkProducts?: boolean }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <span className="relative h-24 w-18 shrink-0 overflow-hidden rounded-xl bg-ivory-dark">
              <ProductImage src={item.productImage} alt="" fill sizes="72px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              {linkProducts && item.productSlug ? (
                <Link href={`/product/${item.productSlug}`} className="font-medium hover:text-rose-700">{item.productTitle}</Link>
              ) : (
                <p className="font-medium">{item.productTitle}</p>
              )}
              <p className="mt-1 text-sm text-muted">
                Size <strong className="font-medium text-charcoal">{item.size}</strong> · Qty{" "}
                <strong className="font-medium text-charcoal">{item.quantity}</strong> · {formatINR(item.unitPrice)} each
              </p>
            </div>
            <p className="font-medium">{formatINR(item.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shippingFee === 0 ? "Free" : formatINR(order.shippingFee)}</dd></div>
        <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd>{formatINR(order.total)}</dd></div>
        <div className="flex justify-between text-muted"><dt>Payment</dt><dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</dd></div>
      </dl>
    </div>
  );
}

export function ShippingAddress({ order }: { order: Order }) {
  return (
    <address className="text-sm leading-relaxed not-italic">
      <strong className="font-medium">{order.customerName}</strong>
      <br />
      {order.addressLine}
      <br />
      {order.city}, {order.state} — {order.pincode}
      <br />
      <a href={`tel:+91${order.phone}`} className="text-rose-700 hover:underline">+91 {order.phone}</a>
    </address>
  );
}
