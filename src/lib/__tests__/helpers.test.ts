import { describe, expect, it } from "vitest";
import { orderErrorMessage } from "../actions/errors";
import { buildShopHref, categoriesMatching, filterProducts, parseCatalogParams, sanitizeSearch } from "../catalog";
import { DEMO_PRODUCTS } from "../demo-data";
import { fitWithin, validateImageFile } from "../image-utils";
import { amountToFreeShipping, calculateTotals } from "../pricing";
import { storagePathFromPublicUrl } from "../storage";
import { discountPercent, formatINR, safeNextPath, slugify } from "../utils";
import { buildProductInquiryMessage, GENERAL_INQUIRY_MESSAGE, whatsappLink } from "../whatsapp";

describe("pricing", () => {
  it("charges ₹79 below ₹999 and ships free from ₹999", () => {
    expect(calculateTotals([{ price: 500, quantity: 1 }])).toEqual({ subtotal: 500, shipping: 79, total: 579 });
    expect(calculateTotals([{ price: 999, quantity: 1 }]).shipping).toBe(0);
    expect(calculateTotals([]).total).toBe(0);
    expect(amountToFreeShipping(700)).toBe(299);
  });

  it("formats rupees and discounts", () => {
    expect(formatINR(129900)).toBe("₹1,29,900");
    expect(discountPercent(1899, 1299)).toBe(32);
    expect(discountPercent(1000, 1000)).toBe(0);
    expect(discountPercent(0, 10)).toBe(0);
  });
});

describe("whatsapp", () => {
  it("builds the product inquiry message", () => {
    expect(buildProductInquiryMessage("Banarasi Saree", "Free Size")).toBe(
      "Hi Mini Closet, I am interested in inquiring about Banarasi Saree (Size: Free Size)",
    );
  });

  it("encodes the prefilled message and prefixes India's country code", () => {
    const link = whatsappLink(GENERAL_INQUIRY_MESSAGE, "98765 43210");
    expect(link).toBe(
      `https://wa.me/919876543210?text=${encodeURIComponent("Hi Mini Closet, I have an inquiry regarding my order / shopping.")}`,
    );
    expect(whatsappLink("x", "919876543210")).toMatch(/^https:\/\/wa\.me\/919876543210/);
  });

  it("returns null when the number is not configured", () => {
    expect(whatsappLink("hi", "")).toBeNull();
  });
});

describe("catalog filters", () => {
  it("filters by category, price range, stock and search", () => {
    expect(filterProducts(DEMO_PRODUCTS, { category: "saree" }).every((p) => p.category === "saree")).toBe(true);
    const ranged = filterProducts(DEMO_PRODUCTS, { min: 2000, max: 3999 });
    expect(ranged.length).toBeGreaterThan(0);
    expect(ranged.every((p) => p.price >= 2000 && p.price <= 3999)).toBe(true);
    expect(filterProducts(DEMO_PRODUCTS, { inStock: true }).every((p) => p.stock > 0)).toBe(true);
    expect(filterProducts(DEMO_PRODUCTS, { q: "banarasi" }).map((p) => p.slug)).toEqual(["banarasi-zari-silk-saree"]);
    expect(filterProducts(DEMO_PRODUCTS, { q: "sarees" }).every((p) => p.category === "saree")).toBe(true);
  });

  it("sorts by price", () => {
    const asc = filterProducts(DEMO_PRODUCTS, { sort: "price-asc" }).map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
  });

  it("parses and rebuilds URL params safely", () => {
    const f = parseCatalogParams({ category: "kurti", q: "silk%'),(", min: "100", max: "-5", sort: "bogus" });
    expect(f).toEqual({ category: "kurti", q: "silk", min: 100, max: undefined, sort: undefined, inStock: undefined });
    expect(buildShopHref(f)).toBe("/shop?category=kurti&q=silk&min=100");
    expect(sanitizeSearch("cord,set.(x)")).toBe("cord set x");
    expect(categoriesMatching("cord set")).toEqual(["cord-set"]);
    expect(categoriesMatching("ab")).toEqual([]);
  });
});

describe("misc helpers", () => {
  it("prevents open redirects", () => {
    expect(safeNextPath("/checkout")).toBe("/checkout");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
  });

  it("slugifies titles", () => {
    expect(slugify("Rani Pink — Palazzo Suit!")).toBe("rani-pink-palazzo-suit");
  });

  it("validates images", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 1000 }).ok).toBe(true);
    expect(validateImageFile({ type: "image/gif", size: 1000 }).ok).toBe(false);
    expect(validateImageFile({ type: "image/png", size: 6 * 1024 * 1024 }).ok).toBe(false);
    expect(fitWithin(4000, 3000, 1800)).toEqual({ width: 1800, height: 1350 });
    expect(fitWithin(800, 600, 1800)).toEqual({ width: 800, height: 600 });
  });

  it("maps storage URLs back to object paths", () => {
    const base = "https://abc.supabase.co";
    expect(
      storagePathFromPublicUrl(`${base}/storage/v1/object/public/product-images/products/2026/10/a%20b.jpg`, base),
    ).toBe("products/2026/10/a b.jpg");
    expect(storagePathFromPublicUrl("/products/kurti-rose.svg", base)).toBeNull();
  });

  it("maps database error codes to friendly copy", () => {
    expect(orderErrorMessage({ message: "INSUFFICIENT_STOCK", details: "Banarasi Saree", hint: "2" })).toBe(
      "Only 2 left of Banarasi Saree. Please reduce the quantity.",
    );
    expect(orderErrorMessage({ message: "INSUFFICIENT_STOCK", details: "Saree", hint: "0" })).toMatch(/sold out/);
    expect(orderErrorMessage({ message: "something internal" })).toBe("Something went wrong. Please try again.");
  });
});
