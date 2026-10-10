import { NextResponse, type NextRequest } from "next/server";
import { sanitizeSearch } from "@/lib/catalog";
import { searchProducts } from "@/lib/data/products";

/** Live search suggestions for the header search bar. */
export async function GET(request: NextRequest) {
  const q = sanitizeSearch(request.nextUrl.searchParams.get("q") ?? undefined);
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  try {
    const products = await searchProducts(q, 6);
    const results = products.map(({ id, slug, title, category, price, mrp, stock, sizes, images, isActive }) => ({
      id,
      slug,
      title,
      category,
      price,
      mrp,
      stock,
      sizes,
      images: images.slice(0, 1),
      isActive,
    }));
    return NextResponse.json({ results }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
