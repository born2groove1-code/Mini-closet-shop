"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { updateOrder } from "@/lib/actions/admin-orders";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUSES,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import type { Order } from "@/lib/types";
import { useUIStore } from "@/stores/ui";

/** Mirrors the transition rules enforced by the orders trigger in the database. */
function allowedStatuses(current: OrderStatus): OrderStatus[] {
  if (current === "cancelled") return ["cancelled"];
  if (current === "delivered") return ORDER_STATUSES.filter((s) => s !== "cancelled");
  return [...ORDER_STATUSES];
}

export function OrderUpdateForm({ order }: { order: Order }) {
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const locked = order.status === "cancelled";
  const cancelling = status === "cancelled" && order.status !== "cancelled";

  function save() {
    startTransition(async () => {
      const res = await updateOrder({ orderId: order.id, status, paymentStatus, trackingNumber, adminNote });
      setConfirmCancel(false);
      if (res.ok) {
        toast({
          tone: "success",
          title: cancelling ? "Order cancelled — stock restored" : "Order updated",
        });
        router.refresh();
      } else {
        toast({ tone: "error", title: "Could not update order", description: res.error });
      }
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (cancelling) setConfirmCancel(true);
    else save();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="o-status" className="field-label">Order status</label>
        <select id="o-status" className="field-input" value={status} disabled={locked}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {allowedStatuses(order.status).map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
        {locked && <p className="mt-1.5 text-xs text-muted">Cancelled orders are final; stock was restored automatically.</p>}
      </div>
      <div>
        <label htmlFor="o-pay" className="field-label">Payment status</label>
        <select id="o-pay" className="field-input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">Marking an order Delivered auto-sets COD payment to Paid.</p>
      </div>
      <div>
        <label htmlFor="o-track" className="field-label">Tracking number / courier</label>
        <input id="o-track" className="field-input" maxLength={80} value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. DTDC D12345678" />
      </div>
      <div>
        <label htmlFor="o-note" className="field-label">Internal note</label>
        <textarea id="o-note" rows={2} maxLength={1000} className="field-input resize-none" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="e.g. COD verified on call" />
      </div>

      {cancelling && (
        <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Cancelling returns every item&apos;s quantity to inventory and cannot be undone.
        </p>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending && <Spinner />} Save changes
      </button>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Confirm cancellation">
        <h2 className="text-2xl">Cancel this order?</h2>
        <p className="mt-2 text-sm text-muted">Stock for all items will be restored. This cannot be undone.</p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn btn-ghost flex-1 border border-line" onClick={() => setConfirmCancel(false)}>Go back</button>
          <button type="button" className="btn flex-1 bg-danger text-white hover:bg-danger/90" onClick={save} disabled={pending}>
            {pending && <Spinner />} Cancel order
          </button>
        </div>
      </Modal>
    </form>
  );
}
