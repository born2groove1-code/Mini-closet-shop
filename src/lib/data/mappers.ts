import { isCategorySlug, isSize, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/lib/constants";
import type { Order, OrderItem, Product, Profile } from "@/lib/types";

/* Row shapes as returned by PostgREST (snake_case). */
export type ProductRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  details: string;
  fabric: string;
  care: string;
  mrp: number | string;
  price: number | string;
  stock: number;
  sizes: string[];
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

export const PRODUCT_COLUMNS =
  "id, slug, title, category, description, details, fabric, care, mrp, price, stock, sizes, images, is_featured, is_active, created_at";

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: isCategorySlug(row.category) ? row.category : "kurti",
    description: row.description ?? "",
    details: row.details ?? "",
    fabric: row.fabric ?? "",
    care: row.care ?? "",
    mrp: Number(row.mrp),
    price: Number(row.price),
    stock: row.stock,
    sizes: (row.sizes ?? []).filter(isSize),
    images: row.images ?? [],
    isFeatured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_title: string;
  product_slug: string | null;
  product_image: string | null;
  category: string | null;
  size: string;
  unit_price: number | string;
  unit_mrp: number | string | null;
  quantity: number;
  line_total: number | string;
};

export type OrderRow = {
  id: string;
  order_number: number;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  subtotal: number | string;
  shipping_fee: number | string;
  total: number | string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  tracking_number: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  order_items?: OrderItemRow[];
};

export const ORDER_COLUMNS =
  "id, order_number, user_id, customer_name, customer_email, phone, address_line, city, state, pincode, notes, subtotal, shipping_fee, total, status, payment_method, payment_status, tracking_number, admin_note, created_at, updated_at, confirmed_at, shipped_at, delivered_at, cancelled_at, order_items(id, product_id, product_title, product_slug, product_image, category, size, unit_price, unit_mrp, quantity, line_total)";

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title,
    productSlug: row.product_slug,
    productImage: row.product_image,
    category: row.category,
    size: row.size,
    unitPrice: Number(row.unit_price),
    unitMrp: row.unit_mrp === null ? null : Number(row.unit_mrp),
    quantity: row.quantity,
    lineTotal: Number(row.line_total),
  };
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    notes: row.notes,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    trackingNumber: row.tracking_number,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at,
    shippedAt: row.shipped_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    items: (row.order_items ?? []).map(mapOrderItem),
  };
}

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  role: "customer" | "admin";
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    role: row.role,
  };
}
