import { z } from "zod";
import {
  CATEGORY_SLUGS,
  INDIAN_STATES,
  MAX_CART_LINES,
  MAX_IMAGES_PER_PRODUCT,
  MAX_QTY_PER_LINE,
  SIZES,
} from "./constants";

/** Strips spaces, dashes and a leading +91 / 0 to get the bare 10-digit mobile number. */
export function normalizeIndianMobile(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
export const PINCODE_RE = /^[1-9]\d{5}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizeIndianMobile)
  .refine((v) => INDIAN_MOBILE_RE.test(v), "Enter a valid 10-digit Indian mobile number");

export const pincodeSchema = z
  .string()
  .trim()
  .regex(PINCODE_RE, "Enter a valid 6-digit PIN code");

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const cartLineSchema = z.object({
  productId: z.guid("Invalid product"),
  size: z.enum(SIZES),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

export const cartLinesSchema = z
  .array(cartLineSchema)
  .min(1, "Your bag is empty")
  .max(MAX_CART_LINES, `A single order can have at most ${MAX_CART_LINES} items`);

export const shippingSchema = z.object({
  fullName: requiredText("Full name", 2, 120),
  phone: phoneSchema,
  addressLine: requiredText("Address", 5, 300),
  city: requiredText("City", 2, 80),
  state: z.enum(INDIAN_STATES, "Select your state"),
  pincode: pincodeSchema,
  notes: z.string().trim().max(500, "Notes must be at most 500 characters").optional().default(""),
});

export const checkoutSchema = shippingSchema.extend({
  saveAddress: z.boolean().optional().default(false),
  items: cartLinesSchema,
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const profileSchema = z.object({
  fullName: optionalText(120),
  phone: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : normalizeIndianMobile(v)))
    .refine((v) => v === null || INDIAN_MOBILE_RE.test(v), "Enter a valid 10-digit Indian mobile number")
    .nullable()
    .optional(),
  addressLine: optionalText(300),
  city: optionalText(80),
  state: optionalText(80),
  pincode: z
    .string()
    .trim()
    .refine((v) => v === "" || PINCODE_RE.test(v), "Enter a valid 6-digit PIN code")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});
export type ProfileInput = z.input<typeof profileSchema>;

const imageSrc = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (src) => (src.startsWith("/") && !src.startsWith("//")) || src.startsWith("https://"),
    "Invalid image URL",
  );

const money = (label: string) =>
  z
    .number(`${label} is required`)
    .finite()
    .min(0, `${label} cannot be negative`)
    .max(10_00_000, `${label} looks too large`)
    .transform((v) => Math.round(v * 100) / 100);

export const productSchema = z
  .object({
    title: requiredText("Title", 2, 120),
    category: z.enum(CATEGORY_SLUGS, "Choose a category"),
    description: z.string().trim().max(500, "Short description must be at most 500 characters"),
    details: z.string().trim().max(4000).optional().default(""),
    fabric: z.string().trim().max(200).optional().default(""),
    care: z.string().trim().max(500).optional().default(""),
    mrp: money("MRP"),
    price: money("Offer price"),
    stock: z.number("Stock is required").int("Stock must be a whole number").min(0, "Stock cannot be negative").max(100_000),
    sizes: z.array(z.enum(SIZES)).min(1, "Select at least one size"),
    images: z.array(imageSrc).max(MAX_IMAGES_PER_PRODUCT, `At most ${MAX_IMAGES_PER_PRODUCT} images`),
    isFeatured: z.boolean(),
    isActive: z.boolean(),
  })
  .refine((p) => p.price <= p.mrp, {
    message: "Offer price cannot be higher than MRP",
    path: ["price"],
  });
export type ProductInput = z.input<typeof productSchema>;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid e-mail address"));
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password") });
export const signupSchema = z.object({
  fullName: requiredText("Full name", 2, 120),
  email: emailSchema,
  password: passwordSchema,
});

/** Flatten Zod issues into `{ field: [messages] }` for form display. */
export function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}
