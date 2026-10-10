/**
 * Regenerates the seed block of the SQL migration from src/lib/demo-data.ts
 * so the preview catalogue and the database seed never drift apart.
 *
 *   npm run seed:sql
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_PRODUCTS } from "../src/lib/demo-data.ts";

const migrationPath = join(
  import.meta.dirname,
  "..",
  "supabase",
  "migrations",
  "20261010000000_mini_closet_init.sql",
);

const q = (value: string) => `'${value.replace(/'/g, "''")}'`;
const arr = (values: string[]) => `array[${values.map(q).join(", ")}]::text[]`;

const rows = DEMO_PRODUCTS.map(
  (p) =>
    `  (${q(p.id)}, ${q(p.slug)}, ${q(p.title)}, ${q(p.category)},\n` +
    `   ${q(p.description)},\n` +
    `   ${q(p.details)},\n` +
    `   ${q(p.fabric)}, ${q(p.care)},\n` +
    `   ${p.mrp}, ${p.price}, ${p.stock}, ${arr(p.sizes)}, ${arr(p.images)}, ${p.isFeatured}, ${p.isActive}, ${q(p.createdAt)})`,
);

const block = [
  "-- BEGIN SEED",
  "insert into public.products",
  "  (id, slug, title, category, description, details, fabric, care, mrp, price, stock, sizes, images, is_featured, is_active, created_at)",
  "values",
  rows.join(",\n"),
  "on conflict (slug) do nothing;",
  "-- END SEED",
].join("\n");

const sql = readFileSync(migrationPath, "utf8");
const next = sql.replace(/-- BEGIN SEED[\s\S]*-- END SEED/, block);
writeFileSync(migrationPath, next);
console.log(`Seed block updated with ${DEMO_PRODUCTS.length} products.`);
