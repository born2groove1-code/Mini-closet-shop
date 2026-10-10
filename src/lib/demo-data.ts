import type { Product } from "./types";

/**
 * Demo catalogue. The exact same rows are seeded by the SQL migration
 * (`supabase/migrations/*_mini_closet_init.sql`, generated with
 * `npm run seed:sql`) and are used as a read-only preview catalogue when
 * Supabase environment variables are not configured yet.
 *
 * Images point at self-contained SVG illustrations in /public/products.
 * Swap them for real boutique photos from the admin dashboard.
 */
type DemoProduct = Omit<Product, "createdAt" | "isActive"> & { isActive?: boolean };

const demo: DemoProduct[] = [
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000001",
    slug: "gulabi-chikankari-cotton-kurti",
    title: "Gulabi Chikankari Cotton Kurti",
    category: "kurti",
    description:
      "Soft rose cotton kurti with hand-done Lucknowi chikankari on the yoke and sleeves.",
    details:
      "A breezy straight-cut kurti finished with delicate shadow-work chikankari. Three-quarter sleeves, side slits and a calf length that pairs beautifully with palazzos or churidars.",
    fabric: "100% Cotton",
    care: "Gentle hand wash in cold water. Dry in shade. Warm iron on reverse.",
    mrp: 1899,
    price: 1299,
    stock: 14,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/products/kurti-rose.svg", "/products/kurti-rose-detail.svg"],
    isFeatured: true,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000002",
    slug: "neel-block-print-a-line-kurti",
    title: "Neel Block Print A-Line Kurti",
    category: "kurti",
    description: "Indigo hand block-printed A-line kurti from Jaipur with mandarin collar.",
    details:
      "Printed by artisans using traditional wooden blocks and natural indigo. Flared A-line silhouette, mandarin collar and wooden buttons on the placket.",
    fabric: "Cambric Cotton",
    care: "Wash separately in cold water. Do not bleach. Dry in shade.",
    mrp: 1499,
    price: 999,
    stock: 3,
    sizes: ["M", "L", "XL"],
    images: ["/products/kurti-indigo.svg", "/products/kurti-indigo-detail.svg"],
    isFeatured: false,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000003",
    slug: "zari-butti-festive-silk-kurti",
    title: "Zari Butti Festive Silk Kurti",
    category: "kurti",
    description: "Wine art-silk kurti with woven zari buttis and a gota-trimmed hem.",
    details:
      "A festive straight kurti woven with antique-gold zari buttis. Finished with gota lace on the hem and sleeves; lined for comfort.",
    fabric: "Art Silk with Cotton Lining",
    care: "Dry clean only.",
    mrp: 2499,
    price: 1799,
    stock: 8,
    sizes: ["S", "M", "L", "XL"],
    images: ["/products/kurti-wine.svg", "/products/kurti-wine-detail.svg"],
    isFeatured: true,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000004",
    slug: "mehendi-anarkali-suit-set",
    title: "Mehendi Anarkali Suit Set",
    category: "suit",
    description: "Olive-green flared anarkali with churidar and a sheer gold-edged dupatta.",
    details:
      "A graceful floor-grazing anarkali with a sequinned yoke, paired with a matching churidar and organza dupatta edged in gold lace. Ideal for mehendi and haldi functions.",
    fabric: "Georgette Anarkali, Santoon Churidar, Organza Dupatta",
    care: "Dry clean recommended.",
    mrp: 4299,
    price: 2999,
    stock: 6,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/products/suit-mehendi.svg", "/products/suit-mehendi-detail.svg"],
    isFeatured: true,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000005",
    slug: "ivory-straight-salwar-suit",
    title: "Ivory Straight Salwar Suit",
    category: "suit",
    description: "Ivory straight suit with rose thread embroidery, salwar and mulmul dupatta.",
    details:
      "An elegant straight-cut kameez with tonal rose resham embroidery, matching salwar with tassel drawstring and a soft printed mulmul dupatta.",
    fabric: "Cotton Silk Kameez, Cotton Salwar, Mulmul Dupatta",
    care: "Hand wash in cold water separately. Dry in shade.",
    mrp: 3499,
    price: 2499,
    stock: 0,
    sizes: ["M", "L", "XL"],
    images: ["/products/suit-ivory.svg", "/products/suit-ivory-detail.svg"],
    isFeatured: false,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000006",
    slug: "rani-pink-palazzo-suit",
    title: "Rani Pink Palazzo Suit",
    category: "suit",
    description: "Rani pink kurta with mirror-work neckline, palazzo and bandhani dupatta.",
    details:
      "A celebratory three-piece set with hand-placed mirror work, wide-leg palazzo and a vibrant bandhani dupatta. Comfortable for long festive days.",
    fabric: "Rayon Kurta & Palazzo, Chiffon Dupatta",
    care: "Hand wash cold. Do not wring. Dry in shade.",
    mrp: 3199,
    price: 2199,
    stock: 11,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/products/suit-rani.svg", "/products/suit-rani-detail.svg"],
    isFeatured: false,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000007",
    slug: "banarasi-zari-silk-saree",
    title: "Banarasi Zari Silk Saree",
    category: "saree",
    description: "Magenta Banarasi silk saree with antique gold zari border and rich pallu.",
    details:
      "A timeless Banarasi drape woven with antique-gold zari florals, a broad border and an elaborate pallu. Comes with an unstitched running blouse piece.",
    fabric: "Banarasi Art Silk (5.5 m saree + 0.8 m blouse piece)",
    care: "Dry clean only. Store wrapped in muslin.",
    mrp: 6999,
    price: 4999,
    stock: 4,
    sizes: ["Free Size"],
    images: ["/products/saree-banarasi.svg", "/products/saree-banarasi-detail.svg"],
    isFeatured: true,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000008",
    slug: "peach-georgette-floral-saree",
    title: "Peach Georgette Floral Saree",
    category: "saree",
    description: "Lightweight peach georgette saree with printed florals and satin border.",
    details:
      "Flowing, featherlight georgette printed with soft florals and finished with a satin border. Effortless for day functions and office celebrations.",
    fabric: "Georgette (5.5 m saree + 0.8 m blouse piece)",
    care: "Dry clean recommended. Low iron.",
    mrp: 2799,
    price: 1899,
    stock: 9,
    sizes: ["Free Size"],
    images: ["/products/saree-peach.svg", "/products/saree-peach-detail.svg"],
    isFeatured: false,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000009",
    slug: "kanjeevaram-temple-border-saree",
    title: "Kanjeevaram Temple Border Saree",
    category: "saree",
    description: "Emerald soft-silk saree with contrast temple border in rose and gold.",
    details:
      "Inspired by South Indian Kanjeevaram weaves: a lustrous emerald body with contrast rose temple border and gold zari checks on the pallu.",
    fabric: "Soft Silk (5.5 m saree + 0.8 m blouse piece)",
    care: "Dry clean only.",
    mrp: 5499,
    price: 3999,
    stock: 2,
    sizes: ["Free Size"],
    images: ["/products/saree-emerald.svg", "/products/saree-emerald-detail.svg"],
    isFeatured: true,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000010",
    slug: "marigold-printed-cord-set",
    title: "Marigold Printed Cord Set",
    category: "cord-set",
    description: "Marigold-yellow printed shirt top with straight pants — easy festive casual.",
    details:
      "A relaxed button-down top with ethnic motifs and matching straight-leg pants with an elasticated waist and pockets.",
    fabric: "Rayon Slub",
    care: "Machine wash gentle, cold. Dry in shade.",
    mrp: 2299,
    price: 1599,
    stock: 12,
    sizes: ["S", "M", "L", "XL"],
    images: ["/products/cordset-marigold.svg", "/products/cordset-marigold-detail.svg"],
    isFeatured: true,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000011",
    slug: "lavender-chanderi-cord-set",
    title: "Lavender Chanderi Cord Set",
    category: "cord-set",
    description: "Lavender Chanderi kurta-top with flared palazzo and delicate gota detailing.",
    details:
      "Sheer-luxe Chanderi top with gota-patti neckline, paired with a flowing palazzo. Fully lined.",
    fabric: "Chanderi Silk with Cotton Lining",
    care: "Dry clean recommended.",
    mrp: 2999,
    price: 2199,
    stock: 5,
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: ["/products/cordset-lavender.svg", "/products/cordset-lavender-detail.svg"],
    isFeatured: false,
  },
  {
    id: "6f1c2a9e-0001-4a4b-9c1d-000000000012",
    slug: "ajrakh-print-co-ord-set",
    title: "Ajrakh Print Co-ord Set",
    category: "cord-set",
    description: "Earthy madder-red Ajrakh co-ord with kaftan top and tapered pants.",
    details:
      "Hand block-printed Ajrakh from Kutch on soft cotton. Relaxed kaftan top with tassel tie and tapered pants with side pockets.",
    fabric: "Modal Cotton",
    care: "Hand wash cold separately. Colours may bleed slightly in first wash.",
    mrp: 2599,
    price: 1799,
    stock: 1,
    sizes: ["Free Size"],
    images: ["/products/cordset-ajrakh.svg", "/products/cordset-ajrakh-detail.svg"],
    isFeatured: false,
  },
];

const DEMO_CREATED_AT = "2026-01-01T00:00:00.000Z";

export const DEMO_PRODUCTS: Product[] = demo.map((p, index) => ({
  ...p,
  isActive: p.isActive ?? true,
  // Preserve list order: newer items first, like the seeded database.
  createdAt: new Date(Date.parse(DEMO_CREATED_AT) - index * 60_000).toISOString(),
}));
