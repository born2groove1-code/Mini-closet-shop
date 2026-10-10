import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/store/product-gallery";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { RelatedCarousel } from "@/components/store/related-carousel";
import { SectionHeading } from "@/components/store/section-heading";
import { categoryLabel, CATEGORIES } from "@/lib/constants";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { env } from "@/lib/env";
import { STORE } from "@/lib/store-config";

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0];
  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: image && !image.endsWith(".svg") ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 8);
  const category = CATEGORIES.find((c) => c.slug === product.category);

  const specs = [
    { label: "Category", value: categoryLabel(product.category) },
    { label: "Fabric", value: product.fabric },
    { label: "Available sizes", value: product.sizes.join(", ") },
    { label: "Care", value: product.care },
  ].filter((s) => s.value);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    category: categoryLabel(product.category),
    image: product.images.map((src) => (src.startsWith("/") ? `${env.siteUrl}${src}` : src)),
    brand: { "@type": "Brand", name: STORE.fullName },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${env.siteUrl}/product/${product.slug}`,
    },
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped is safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <nav aria-label="Breadcrumb" className="mb-5 text-xs text-muted">
        <Link href="/" className="hover:text-rose-700">Home</Link> <span aria-hidden>/</span>{" "}
        <Link href={`/shop?category=${product.category}`} className="hover:text-rose-700">{category?.plural}</Link>{" "}
        <span aria-hidden>/</span> <span className="text-charcoal">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <ProductGallery images={product.images} title={product.title} />
        <div className="lg:pt-2">
          <PurchasePanel product={product} />

          <section className="mt-8 border-t border-line pt-6" aria-labelledby="details-title">
            <h2 id="details-title" className="text-2xl">Product details</h2>
            {product.details && <p className="mt-3 text-[15px] leading-relaxed text-muted">{product.details}</p>}
            <dl className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white">
              {specs.map((s) => (
                <div key={s.label} className="grid grid-cols-[120px_1fr] gap-4 px-4 py-3 text-sm sm:grid-cols-[150px_1fr]">
                  <dt className="text-muted">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">
              Colours may vary slightly due to photography and screen settings. Easy {STORE.returns.windowDays}-day
              exchange — <Link href="/help#returns" className="text-rose-700 underline">see policy</Link>.
            </p>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 sm:mt-24" aria-labelledby="related-title">
          <SectionHeading eyebrow="You may also love" title="Related Products" id="related-title" />
          <RelatedCarousel products={related} />
        </section>
      )}
    </div>
  );
}
