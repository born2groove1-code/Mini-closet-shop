"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { checkoutSchema, fieldErrors, type CheckoutInput } from "@/lib/validation";
import { orderErrorMessage } from "./errors";

export async function placeOrder(
  input: CheckoutInput,
): Promise<ActionResult<{ orderId: string; orderNumber: number }>> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Checkout is disabled in preview mode. Connect Supabase to accept orders." };
  }

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in to place your order." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();

  // Prices and stock are re-read and locked inside the database function;
  // the client only sends product ids, sizes and quantities.
  const { data, error } = await supabase.rpc("place_order", {
    p_items: d.items.map((i) => ({ product_id: i.productId, size: i.size, quantity: i.quantity })),
    p_customer_name: d.fullName,
    p_phone: d.phone,
    p_address_line: d.addressLine,
    p_city: d.city,
    p_state: d.state,
    p_pincode: d.pincode,
    p_notes: d.notes || null,
    p_payment_method: "cod",
  });

  if (error || !data) {
    if (error && !error.message?.match(/^[A-Z_]+$/)) console.error("[placeOrder]", error);
    return { ok: false, error: orderErrorMessage(error ?? {}) };
  }

  if (d.saveAddress) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: d.fullName,
        phone: d.phone,
        address_line: d.addressLine,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
      })
      .eq("id", user.id);
    if (profileError) console.error("[placeOrder] saving address failed", profileError.message);
  }

  revalidatePath("/account/orders");
  revalidatePath("/admin", "layout");
  const result = data as { id: string; order_number: number };
  return { ok: true, data: { orderId: result.id, orderNumber: result.order_number } };
}
