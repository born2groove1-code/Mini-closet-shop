"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin, AuthError } from "@/lib/auth";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";
import { orderErrorMessage } from "./errors";

const updateSchema = z.object({
  orderId: z.guid(),
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  trackingNumber: z.string().trim().max(80).optional().default(""),
  adminNote: z.string().trim().max(1000).optional().default(""),
});

export async function updateOrder(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid order update." };
    const d = parsed.data;

    // The orders trigger stamps timestamps, guards transitions and restores
    // stock exactly once when an order is cancelled.
    const { error } = await supabase
      .from("orders")
      .update({
        status: d.status,
        payment_status: d.paymentStatus,
        tracking_number: d.trackingNumber || null,
        admin_note: d.adminNote || null,
      })
      .eq("id", d.orderId);
    if (error) return { ok: false, error: orderErrorMessage(error) };

    revalidatePath("/admin", "layout");
    revalidatePath(`/account/orders/${d.orderId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    console.error("[updateOrder]", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
