import { describe, expect, it } from "vitest";
import { addToCart, cartKey, reconcileCart, setLineQuantity, type CartItem } from "../cart-logic";
import type { ProductSummary } from "../types";

const base: Omit<CartItem, "quantity"> = {
  productId: "p1",
  slug: "gulabi",
  title: "Gulabi Kurti",
  image: null,
  category: "kurti",
  size: "M",
  price: 1299,
  mrp: 1899,
  stock: 3,
};

describe("addToCart", () => {
  it("adds and merges the same product + size", () => {
    let r = addToCart([], base, 1);
    expect(r.added).toBe(1);
    r = addToCart(r.items, base, 1);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].quantity).toBe(2);
  });

  it("caps quantity by stock across all sizes of a product", () => {
    let r = addToCart([], base, 2);
    r = addToCart(r.items, { ...base, size: "L" }, 5);
    expect(r.added).toBe(1);
    expect(r.reason).toBe("limit");
    const again = addToCart(r.items, { ...base, size: "XL" }, 1);
    expect(again.added).toBe(0);
    expect(again.reason).toBe("out-of-stock");
  });

  it("refuses out of stock products", () => {
    expect(addToCart([], { ...base, stock: 0 }, 1).reason).toBe("out-of-stock");
  });

  it("keeps other products' stock untouched", () => {
    const other = { ...base, productId: "p2", stock: 9 };
    let r = addToCart([], other, 1);
    r = addToCart(r.items, base, 1);
    r = addToCart(r.items, base, 1);
    expect(r.items.find((i) => i.productId === "p2")?.stock).toBe(9);
  });
});

describe("setLineQuantity", () => {
  it("removes a line at zero and clamps to stock", () => {
    const { items } = addToCart([], base, 1);
    const key = cartKey("p1", "M");
    expect(setLineQuantity(items, key, 10)[0].quantity).toBe(3);
    expect(setLineQuantity(items, key, 0)).toHaveLength(0);
  });
});

describe("reconcileCart", () => {
  const server = (patch: Partial<ProductSummary> = {}): ProductSummary => ({
    id: "p1",
    slug: "gulabi",
    title: "Gulabi Kurti",
    category: "kurti",
    price: 1299,
    mrp: 1899,
    stock: 3,
    sizes: ["M", "L"],
    images: ["/a.svg"],
    isActive: true,
    ...patch,
  });

  it("applies authoritative prices and reports the change", () => {
    const items = addToCart([], { ...base, price: 999 }, 1).items;
    const r = reconcileCart(items, [server()]);
    expect(r.items[0].price).toBe(1299);
    expect(r.notices[0].message).toMatch(/price updated/);
  });

  it("caps to live stock across sizes and removes unavailable lines", () => {
    let items = addToCart([], { ...base, stock: 10 }, 2).items;
    items = addToCart(items, { ...base, size: "L", stock: 10 }, 2).items;
    const r = reconcileCart(items, [server({ stock: 3 })]);
    expect(r.items.reduce((n, i) => n + i.quantity, 0)).toBe(3);

    const gone = reconcileCart(items, []);
    expect(gone.items).toHaveLength(0);
    expect(gone.notices).toHaveLength(2);

    const sizeDropped = reconcileCart(items, [server({ sizes: ["M"] })]);
    expect(sizeDropped.items.map((i) => i.size)).toEqual(["M"]);
  });
});
