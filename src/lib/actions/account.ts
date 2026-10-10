"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { fieldErrors, profileSchema, type ProfileInput } from "@/lib/validation";
import { orderErrorMessage } from "./errors";

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Connect Supabase to save your profile." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: d.fullName ?? null,
      phone: d.phone ?? null,
      address_line: d.addressLine ?? null,
      city: d.city ?? null,
      state: d.state ?? null,
      pincode: d.pincode ?? null,
    })
    .eq("id", user.id);
  if (error) {
    console.error("[updateProfile]", error.message);
    return { ok: false, error: "Could not save your profile. Please try again." };
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function cancelMyOrder(orderId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Connect Supabase first." };
  if (!z.guid().safeParse(orderId).success) return { ok: false, error: "Invalid order." };
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("cancel_my_order", { p_order_id: orderId });
  if (error) return { ok: false, error: orderErrorMessage(error) };

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
  return { ok: true };
}
