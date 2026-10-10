"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin, AuthError } from "@/lib/auth";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/constants";
import { storagePathFromPublicUrl } from "@/lib/storage";
import type { ActionResult } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { fieldErrors, productSchema, type ProductInput } from "@/lib/validation";
import { orderErrorMessage } from "./errors";

const idSchema = z.guid();

function revalidateCatalog(slug?: string) {
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/product/${slug}`);
}

function authFailure(error: unknown): { ok: false; error: string } {
  if (error instanceof AuthError) return { ok: false, error: error.message };
  console.error("[admin]", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

async function removeStorageImages(
  supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"],
  urls: string[],
) {
  const paths = urls.map((u) => storagePathFromPublicUrl(u)).filter((p): p is string => Boolean(p));
  if (!paths.length) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  if (error) console.error("[admin] could not delete images", error.message);
}

export async function saveProduct(
  id: string | null,
  input: ProductInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const { supabase } = await assertAdmin();
    if (id && !idSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };

    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    }
    const p = parsed.data;
    const row = {
      title: p.title,
      category: p.category,
      description: p.description,
      details: p.details,
      fabric: p.fabric,
      care: p.care,
      mrp: p.mrp,
      price: p.price,
      stock: p.stock,
      sizes: p.sizes,
      images: p.images,
      is_featured: p.isFeatured,
      is_active: p.isActive,
    };

    if (id) {
      const { data: before } = await supabase.from("products").select("images").eq("id", id).maybeSingle();
      const { data, error } = await supabase.from("products").update(row).eq("id", id).select("id, slug").single();
      if (error || !data) {
        console.error("[saveProduct:update]", error?.message);
        return { ok: false, error: "Could not save the product." };
      }
      // Delete photos that were removed in the form (only after a successful save).
      const removed = ((before?.images as string[] | undefined) ?? []).filter((u) => !p.images.includes(u));
      await removeStorageImages(supabase, removed);
      revalidateCatalog(data.slug);
      return { ok: true, data: { id: data.id, slug: data.slug } };
    }

    const base = slugify(p.title) || "product";
    for (let attempt = 0; attempt < 4; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
      const { data, error } = await supabase.from("products").insert({ ...row, slug }).select("id, slug").single();
      if (!error && data) {
        revalidateCatalog(data.slug);
        return { ok: true, data: { id: data.id, slug: data.slug } };
      }
      if (error?.code !== "23505") {
        console.error("[saveProduct:insert]", error?.message);
        return { ok: false, error: "Could not create the product." };
      }
    }
    return { ok: false, error: "Could not create a unique link for this product. Try a different title." };
  } catch (error) {
    return authFailure(error);
  }
}

export async function adjustStock(id: string, delta: number): Promise<ActionResult<{ stock: number }>> {
  try {
    const { supabase } = await assertAdmin();
    if (!idSchema.safeParse(id).success || !Number.isInteger(delta) || delta === 0) {
      return { ok: false, error: "Invalid stock change." };
    }
    const { data, error } = await supabase.rpc("admin_adjust_stock", { p_product_id: id, p_delta: delta });
    if (error) return { ok: false, error: orderErrorMessage(error) };
    revalidateCatalog();
    return { ok: true, data: { stock: data as number } };
  } catch (error) {
    return authFailure(error);
  }
}

export async function setStock(id: string, stock: number): Promise<ActionResult<{ stock: number }>> {
  try {
    const { supabase } = await assertAdmin();
    if (!idSchema.safeParse(id).success || !Number.isInteger(stock) || stock < 0 || stock > 100_000) {
      return { ok: false, error: "Stock must be a whole number of 0 or more." };
    }
    const { data, error } = await supabase.from("products").update({ stock }).eq("id", id).select("stock").single();
    if (error || !data) return { ok: false, error: "Could not update stock." };
    revalidateCatalog();
    return { ok: true, data: { stock: data.stock as number } };
  } catch (error) {
    return authFailure(error);
  }
}

export async function setProductFlag(
  id: string,
  flag: "isFeatured" | "isActive",
  value: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!idSchema.safeParse(id).success || typeof value !== "boolean") return { ok: false, error: "Invalid request." };
    const column = flag === "isFeatured" ? "is_featured" : "is_active";
    const { error } = await supabase.from("products").update({ [column]: value }).eq("id", id);
    if (error) return { ok: false, error: "Could not update the product." };
    revalidateCatalog();
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!idSchema.safeParse(id).success) return { ok: false, error: "Invalid product." };
    const { data, error } = await supabase.from("products").delete().eq("id", id).select("images").maybeSingle();
    if (error) {
      console.error("[deleteProduct]", error.message);
      return { ok: false, error: "Could not delete the product." };
    }
    // Past orders keep their own snapshot (title, price, size), so this is safe.
    await removeStorageImages(supabase, (data?.images as string[] | undefined) ?? []);
    revalidateCatalog();
    return { ok: true };
  } catch (error) {
    return authFailure(error);
  }
}
