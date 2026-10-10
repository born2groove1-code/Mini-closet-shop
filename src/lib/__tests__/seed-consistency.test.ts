import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../constants";
import { DEMO_PRODUCTS } from "../demo-data";

const root = join(__dirname, "..", "..", "..");
const sql = readFileSync(join(root, "supabase", "migrations", "20261010000000_mini_closet_init.sql"), "utf8");

describe("seed data", () => {
  it("SQL seed matches the demo catalogue (run `npm run seed:sql` after editing demo-data.ts)", () => {
    for (const p of DEMO_PRODUCTS) {
      expect(sql).toContain(`'${p.id}', '${p.slug}'`);
      expect(sql).toContain(`${p.mrp}, ${p.price}, ${p.stock},`);
    }
  });

  it("covers every category and has working image files", () => {
    for (const c of CATEGORIES) expect(DEMO_PRODUCTS.some((p) => p.category === c.slug)).toBe(true);
    for (const p of DEMO_PRODUCTS) {
      expect(p.price).toBeLessThanOrEqual(p.mrp);
      for (const img of p.images) expect(existsSync(join(root, "public", img))).toBe(true);
    }
  });

  it("client shipping estimate mirrors the SQL rule", () => {
    expect(sql).toContain(`when v_subtotal >= ${FREE_SHIPPING_THRESHOLD} then 0 else ${SHIPPING_FEE} end`);
  });
});
