import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductGrid } from "@/components/store/product-card";
import { ShopFilters } from "@/components/store/shop-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { parseCatalogParams } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";
import { listProducts } from "@/lib/data/products";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const { category } = parseCatalogParams(await searchParams);
  const c = CATEGORIES.find((x) => x.slug === category);
  return {
    title: c ? `${c.plural} — Shop` : "Shop the Collection",
    description: c?.blurb ?? "Browse kurtis, suits, sarees and cord sets with All India shipping and Cash on Delivery.",
  };
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const filters = parseCatalogParams(await searchParams);
  const products = await listProducts(filters);
  const category = CATEGORIES.find((c) => c.slug === filters.category);

  return (
    <div className="container-page py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-rose-700">Home</Link> <span aria-hidden>/</span>{" "}
        {category ? (
          <>
            <Link href="/shop" className="hover:text-rose-700">Shop</Link> <span aria-hidden>/</span>{" "}
            <span className="text-charcoal">{category.plural}</span>
          </>
        ) : (
          <span className="text-charcoal">Shop</span>
        )}
      </nav>

      <header className="mt-3 mb-8">
        <p className="eyebrow">Ladies Collection</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">
          {filters.q ? <>Results for “{filters.q}”</> : category ? category.plural : "Shop the Collection"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          {category?.blurb ?? "Kurti | Suit | Saree | Cord Set — handpicked pieces for every occasion and every age."}
        </p>
      </header>

      <ShopFilters filters={filters} resultCount={products.length}>
        {products.length ? (
          <ProductGrid products={products} priorityCount={4} />
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white">
            <EmptyState
              icon={SearchX}
              title="No pieces match your filters"
              description="Try a different search, widen the price range, or browse the full collection."
              action={<Link href="/shop" className="btn btn-primary">View all products</Link>}
            />
          </div>
        )}
      </ShopFilters>
    </div>
  );
}
