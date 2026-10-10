import type {
  CategorySlug,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Size,
} from "./constants";

export type Product = {
  id: string;
  slug: string;
  title: string;
  category: CategorySlug;
  description: string;
  details: string;
  fabric: string;
  care: string;
  mrp: number;
  price: number;
  stock: number;
  sizes: Size[];
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
};

/** Lightweight shape used for search suggestions and cart revalidation. */
export type ProductSummary = Pick<
  Product,
  "id" | "slug" | "title" | "category" | "price" | "mrp" | "stock" | "sizes" | "images" | "isActive"
>;

export type OrderItem = {
  id: string;
  productId: string | null;
  productTitle: string;
  productSlug: string | null;
  productImage: string | null;
  category: string | null;
  size: string;
  unitPrice: number;
  unitMrp: number | null;
  quantity: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  orderNumber: number;
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
};

export type Profile = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  role: "customer" | "admin";
};

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };
