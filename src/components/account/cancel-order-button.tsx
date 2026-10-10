"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { cancelMyOrder } from "@/lib/actions/account";
import { useUIStore } from "@/stores/ui";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const toast = useUIStore((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const res = await cancelMyOrder(orderId);
      setOpen(false);
      if (res.ok) {
        toast({ tone: "success", title: "Order cancelled" });
        router.refresh();
      } else {
        toast({ tone: "error", title: "Could not cancel", description: res.error });
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost w-full border border-line text-danger">
        Cancel order
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Cancel order">
        <h2 className="text-2xl">Cancel this order?</h2>
        <p className="mt-2 text-sm text-muted">You can cancel while the order is still pending. This cannot be undone.</p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn btn-ghost flex-1 border border-line" onClick={() => setOpen(false)}>Keep order</button>
          <button type="button" className="btn flex-1 bg-danger text-white hover:bg-danger/90" onClick={confirm} disabled={pending}>
            {pending && <Spinner />} Yes, cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
