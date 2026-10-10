import "server-only";
import type { OrderStatus } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, Profile } from "@/lib/types";
import { DataError } from "./products";
import { mapOrder, mapProfile, ORDER_COLUMNS, type OrderRow, type ProfileRow } from "./mappers";

/** RLS limits customers to their own orders; admins see every order. */
export async function listMyOrders(userId: string): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new DataError("Could not load your orders.");
  return (data as unknown as OrderRow[]).map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new DataError("Could not load the order.");
  return data ? mapOrder(data as unknown as OrderRow) : null;
}

export type AdminOrderFilters = { status?: OrderStatus; q?: string };

export async function listOrdersForAdmin(filters: AdminOrderFilters = {}): Promise<Order[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).limit(300);
  if (filters.status) query = query.eq("status", filters.status);

  const q = filters.q?.trim();
  if (q) {
    const compact = q.replace(/[\s+-]/g, "");
    const orderNo = /^mc(\d{1,9})$/i.exec(compact)?.[1] ?? /^(\d{1,5})$/.exec(compact)?.[1];
    if (orderNo) {
      query = query.eq("order_number", Number(orderNo)); // "MC-10001" or "10001"
    } else if (/^\d{6}$/.test(compact)) {
      query = query.or(`pincode.eq.${compact},order_number.eq.${compact}`);
    } else if (/^\d{7,12}$/.test(compact)) {
      query = query.like("phone", `%${compact.slice(-10)}%`);
    } else {
      const text = q.replace(/[^\p{L}\p{N}\s.'-]/gu, " ").trim().slice(0, 60);
      if (text) query = query.ilike("customer_name", `%${text}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw new DataError("Could not load orders.");
  return (data as unknown as OrderRow[]).map(mapOrder);
}

export type DashboardStats = {
  pendingOrders: number;
  openOrders: number;
  revenue: number;
  ordersToday: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new DataError("Could not load dashboard statistics.");

  const todayIST = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const rows = data as { status: OrderStatus; total: number | string; created_at: string }[];
  return {
    pendingOrders: rows.filter((r) => r.status === "pending").length,
    openOrders: rows.filter((r) => r.status === "confirmed" || r.status === "shipped").length,
    revenue: rows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + Number(r.total), 0),
    ordersToday: rows.filter(
      (r) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(r.created_at)) === todayIST,
    ).length,
  };
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, address_line, city, state, pincode, role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new DataError("Could not load your profile.");
  return data ? mapProfile(data as ProfileRow) : null;
}
