/**
 * Runs the app's real supabase-js queries against PostgREST + the migrated
 * database. Skipped unless started through `npm run test:api`.
 */
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { orderErrorMessage } from "../actions/errors";
import { mapOrder, mapProduct, ORDER_COLUMNS, PRODUCT_COLUMNS, type OrderRow, type ProductRow } from "../data/mappers";

const API = process.env.API_TEST_URL;
const SECRET = process.env.API_TEST_JWT_SECRET ?? "";

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const PRIYA = "00000000-0000-0000-0000-0000000000c1";
const NEHA = "00000000-0000-0000-0000-0000000000c2";
const BANARASI = "6f1c2a9e-0001-4a4b-9c1d-000000000007";
const GULABI = "6f1c2a9e-0001-4a4b-9c1d-000000000001";

const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
function jwt(sub: string | null) {
  const payload = sub
    ? { sub, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }
    : { role: "anon", exp: Math.floor(Date.now() / 1000) + 3600 };
  const head = `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}`;
  return `${head}.${createHmac("sha256", SECRET).update(head).digest("base64url")}`;
}

/** supabase-js client whose REST calls go to the local PostgREST. */
function client(sub: string | null) {
  const token = jwt(sub);
  return createClient("http://local.test", token, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetch(String(input).replace("http://local.test/rest/v1", API!), init),
    },
  });
}

const checkout = (items: { product_id: string; size: string; quantity: number }[]) => ({
  p_items: items,
  p_customer_name: "Priya Sharma",
  p_phone: "+91 98765 43210",
  p_address_line: "12 MG Road, Indiranagar",
  p_city: "Bengaluru",
  p_state: "Karnataka",
  p_pincode: "560038",
  p_notes: null,
  p_payment_method: "cod",
});

describe.skipIf(!API)("Supabase API (PostgREST) integration", () => {
  it("anon visitors can browse and search the catalogue exactly like listProducts()", async () => {
    const anon = client(null);
    const { data, error } = await anon
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_active", true)
      .or("title.ilike.%silk%,category.in.(saree)")
      .gte("price", 1000)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    expect(error).toBeNull();
    const products = (data as ProductRow[]).map(mapProduct);
    expect(products.length).toBeGreaterThan(2);
    expect(products.every((p) => p.category === "saree" || /silk/i.test(p.title))).toBe(true);
    expect(typeof products[0].price).toBe("number");

    const { error: writeError } = await anon.from("products").update({ price: 1 }).eq("id", GULABI);
    expect(writeError?.message).toMatch(/permission denied/);
    const { data: isAdmin } = await anon.rpc("is_admin");
    expect(isAdmin).toBe(false);
  });

  it("customers place COD orders atomically and read them back with embedded items", async () => {
    const priya = client(PRIYA);
    const { data, error } = await priya.rpc(
      "place_order",
      checkout([
        { product_id: BANARASI, size: "Free Size", quantity: 1 },
        { product_id: GULABI, size: "M", quantity: 2 },
      ]),
    );
    expect(error).toBeNull();
    const placed = data as { id: string; order_number: number; total: number };
    expect(placed.total).toBe(4999 + 1299 * 2);

    const { data: row, error: readError } = await priya.from("orders").select(ORDER_COLUMNS).eq("id", placed.id).single();
    expect(readError).toBeNull();
    const order = mapOrder(row as unknown as OrderRow);
    expect(order.paymentStatus).toBe("pending_cod_verification");
    expect(order.phone).toBe("9876543210");
    expect(order.items).toHaveLength(2);
    expect(order.items.find((i) => i.size === "M")?.lineTotal).toBe(2598);

    // Neha cannot see Priya's order.
    const { data: hidden } = await client(NEHA).from("orders").select("id").eq("id", placed.id);
    expect(hidden).toEqual([]);
  });

  it("returns structured stock errors that the UI turns into friendly copy", async () => {
    const { error } = await client(NEHA).rpc("place_order", checkout([{ product_id: BANARASI, size: "Free Size", quantity: 9 }]));
    expect(error?.message).toBe("INSUFFICIENT_STOCK");
    expect(orderErrorMessage(error!)).toBe("Only 3 left of Banarasi Zari Silk Saree. Please reduce the quantity.");

    const { error: forbidden } = await client(NEHA).rpc("admin_adjust_stock", { p_product_id: GULABI, p_delta: 5 });
    expect(orderErrorMessage(forbidden!)).toBe("Only boutique admins can do that.");
  });

  it("profiles: own fields editable, role locked", async () => {
    const priya = client(PRIYA);
    const ok = await priya.from("profiles").update({ city: "Bengaluru", pincode: "560038" }).eq("id", PRIYA);
    expect(ok.error).toBeNull();
    const locked = await priya.from("profiles").update({ role: "admin" }).eq("id", PRIYA);
    expect(locked.error?.message).toMatch(/permission denied/);
  });

  it("wishlist upserts are idempotent and private", async () => {
    const priya = client(PRIYA);
    for (let i = 0; i < 2; i++) {
      const { error } = await priya
        .from("wishlist_items")
        .upsert({ user_id: PRIYA, product_id: GULABI }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
      expect(error).toBeNull();
    }
    const { data } = await priya.from("wishlist_items").select("product_id");
    expect(data).toEqual([{ product_id: GULABI }]);
    const spoof = await priya.from("wishlist_items").insert({ user_id: NEHA, product_id: GULABI });
    expect(spoof.error?.message).toMatch(/row-level security/);
  });

  it("admins manage inventory and orders; cancelling restores stock", async () => {
    const admin = client(ADMIN);
    expect((await admin.rpc("is_admin")).data).toBe(true);

    const before = (await admin.from("products").select("stock").eq("id", GULABI).single()).data!.stock as number;
    const bumped = await admin.rpc("admin_adjust_stock", { p_product_id: GULABI, p_delta: 3 });
    expect(bumped.data).toBe(before + 3);
    const negative = await admin.rpc("admin_adjust_stock", { p_product_id: GULABI, p_delta: -1000 });
    expect(negative.error?.message).toBe("STOCK_WOULD_BE_NEGATIVE");

    // Admin order search queries used by listOrdersForAdmin().
    const byPin = await admin.from("orders").select(ORDER_COLUMNS).or("pincode.eq.560038,order_number.eq.560038");
    expect(byPin.error).toBeNull();
    expect((byPin.data ?? []).length).toBe(1);
    const byPhone = await admin.from("orders").select("id").like("phone", "%43210%");
    expect(byPhone.data).toHaveLength(1);
    const orderId = (byPin.data as unknown as OrderRow[])[0].id;

    const stockBefore = (await admin.from("products").select("stock").eq("id", BANARASI).single()).data!.stock as number;
    const cancel = await admin
      .from("orders")
      .update({ status: "cancelled", payment_status: "pending_cod_verification", tracking_number: null, admin_note: "Test" })
      .eq("id", orderId);
    expect(cancel.error).toBeNull();
    const stockAfter = (await admin.from("products").select("stock").eq("id", BANARASI).single()).data!.stock as number;
    expect(stockAfter).toBe(stockBefore + 1);

    const reopen = await admin.from("orders").update({ status: "pending" }).eq("id", orderId);
    expect(orderErrorMessage(reopen.error!)).toBe("This order is cancelled and cannot be reopened.");

    const tamper = await admin.from("orders").update({ total: 1 }).eq("id", orderId);
    expect(tamper.error?.message).toMatch(/permission denied/);

    const created = await admin
      .from("products")
      .insert({ slug: "api-test-kurti", title: "API Test Kurti", category: "kurti", mrp: 999, price: 799, stock: 2, sizes: ["M"] })
      .select("id, slug")
      .single();
    expect(created.error).toBeNull();
    const removed = await admin.from("products").delete().eq("id", created.data!.id).select("images").maybeSingle();
    expect(removed.error).toBeNull();
  });
});
