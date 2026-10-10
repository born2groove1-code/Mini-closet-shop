import { describe, expect, it } from "vitest";
import {
  checkoutSchema,
  normalizeIndianMobile,
  phoneSchema,
  pincodeSchema,
  productSchema,
  profileSchema,
} from "../validation";

describe("Indian mobile numbers", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["91 98765-43210", "9876543210"],
    ["09876543210", "9876543210"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it("accepts valid 10-digit mobiles starting 6-9", () => {
    expect(phoneSchema.parse(" 6123456789 ")).toBe("6123456789");
  });

  it.each(["5123456789", "98765", "98765432101", "abcdefghij"])("rejects %s", (bad) => {
    expect(phoneSchema.safeParse(bad).success).toBe(false);
  });
});

describe("PIN codes", () => {
  it("accepts 6 digits not starting with 0", () => {
    expect(pincodeSchema.parse("560038")).toBe("560038");
  });
  it.each(["056003", "56003", "5600381", "56OO38"])("rejects %s", (bad) => {
    expect(pincodeSchema.safeParse(bad).success).toBe(false);
  });
});

const validCheckout = {
  fullName: "Priya Sharma",
  phone: "+91 98765 43210",
  addressLine: "12 MG Road, Indiranagar",
  city: "Bengaluru",
  state: "Karnataka" as const,
  pincode: "560038",
  items: [{ productId: "6f1c2a9e-0001-4a4b-9c1d-000000000001", size: "M" as const, quantity: 2 }],
};

describe("checkoutSchema", () => {
  it("parses a valid checkout and normalises the phone", () => {
    const parsed = checkoutSchema.parse(validCheckout);
    expect(parsed.phone).toBe("9876543210");
    expect(parsed.saveAddress).toBe(false);
    expect(parsed.notes).toBe("");
  });

  it("rejects unknown states, empty bags and bad quantities", () => {
    expect(checkoutSchema.safeParse({ ...validCheckout, state: "Atlantis" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...validCheckout, items: [] }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...validCheckout, items: [{ ...validCheckout.items[0], quantity: 11 }] }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...validCheckout, items: [{ ...validCheckout.items[0], size: "XXXL" }] }).success,
    ).toBe(false);
  });

  it("never accepts client-supplied prices (unknown keys are stripped)", () => {
    const parsed = checkoutSchema.parse({
      ...validCheckout,
      items: [{ ...validCheckout.items[0], price: 1 }],
    });
    expect(parsed.items[0]).not.toHaveProperty("price");
  });
});

describe("productSchema", () => {
  const base = {
    title: "Gulabi Kurti",
    category: "kurti" as const,
    description: "",
    mrp: 1999,
    price: 1299,
    stock: 5,
    sizes: ["M" as const],
    images: ["/products/kurti-rose.svg", "https://x.supabase.co/storage/v1/object/public/product-images/a.jpg"],
    isFeatured: false,
    isActive: true,
  };

  it("accepts a valid product", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it("rejects offer price above MRP, negative stock, no sizes and unsafe image URLs", () => {
    expect(productSchema.safeParse({ ...base, price: 2500 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, stock: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, stock: 1.5 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, sizes: [] }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, images: ["javascript:alert(1)"] }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, images: ["http://insecure.example/a.jpg"] }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, mrp: Number.NaN }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("turns empty strings into nulls", () => {
    expect(profileSchema.parse({ fullName: "", phone: "", pincode: "" })).toMatchObject({
      fullName: null,
      phone: null,
      pincode: null,
    });
  });
});
