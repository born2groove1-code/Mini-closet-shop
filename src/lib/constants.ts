export const CATEGORIES = [
  {
    slug: "kurti",
    label: "Kurti",
    plural: "Kurtis",
    blurb: "Everyday elegance in breathable cottons and festive silks.",
  },
  {
    slug: "suit",
    label: "Suit",
    plural: "Suits",
    blurb: "Three-piece salwar and anarkali sets for every occasion.",
  },
  {
    slug: "saree",
    label: "Saree",
    plural: "Sarees",
    blurb: "Handpicked drapes, from soft georgettes to zari-woven silks.",
  },
  {
    slug: "cord-set",
    label: "Cord Set",
    plural: "Cord Sets",
    blurb: "Easy coordinated sets with an Indian heart and modern ease.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [
  CategorySlug,
  ...CategorySlug[],
];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === "string" && CATEGORY_SLUGS.includes(value as CategorySlug);
}

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "Free Size"] as const;
export type Size = (typeof SIZES)[number];

export function isSize(value: unknown): value is Size {
  return typeof value === "string" && SIZES.includes(value as Size);
}

/** Stock at or below this number shows the "Only X left" badge. */
export const LOW_STOCK_THRESHOLD = 4;

/** Mirror of the shipping rule inside the `place_order` SQL function. */
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 79;

/** Mirror of the per-line limits enforced by `place_order`. */
export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 30;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUSES = [
  "pending_cod_verification",
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending_cod_verification: "Pending COD Verification",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const PAYMENT_METHODS = ["cod", "online"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  online: "Online Payment",
};

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGES_PER_PRODUCT = 8;
