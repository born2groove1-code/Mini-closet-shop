import Link from "next/link";
import { ArrowRight, MessageCircle, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { Hero } from "@/components/store/hero";
import { ProductGrid } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section-heading";
import { ProductImage } from "@/components/ui/product-image";
import { CATEGORIES } from "@/lib/constants";
import { listProducts } from "@/lib/data/products";
import { STORE } from "@/lib/store-config";

export default async function HomePage() {
  const products = await listProducts({ sort: "featured" });
  const featured = products.filter((p) => p.isFeatured).slice(0, 8);
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const coverFor = (slug: string) => products.find((p) => p.category === slug && p.images[0])?.images[0];

  return (
    <>
      <Hero />

      <section className="container-page py-14 sm:py-20" aria-labelledby="categories-title">
        <div className="mb-8 text-center">
          <p className="eyebrow">Kurti | Suit | Saree | Cord Set</p>
          <h2 id="categories-title" className="mt-1 text-3xl sm:text-4xl">Shop by Category</h2>
          <div className="ornament mx-auto mt-3 max-w-xs text-xs" aria-hidden>♥</div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-ivory-dark"
            >
              <ProductImage
                src={coverFor(c.slug)}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/75 via-rose-900/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                <h3 className="text-2xl text-white sm:text-3xl">{c.plural}</h3>
                <p className="mt-1 hidden text-sm text-white/85 sm:block">{c.blurb}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium tracking-[0.16em] text-gold-200 uppercase">
                  Shop now <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page scroll-mt-32 pb-14 sm:pb-20" id="featured">
        <SectionHeading eyebrow="Handpicked for you" title="Featured Collection" href="/shop" />
        {featured.length ? (
          <ProductGrid products={featured} priorityCount={2} />
        ) : (
          <ProductGrid products={products.slice(0, 8)} priorityCount={2} />
        )}
      </section>

      <section className="border-y border-line bg-white">
        <div className="container-page grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "All India Shipping", text: `Delivered in ${STORE.shipping.deliveryWindow}` },
            { icon: ShieldCheck, title: "Cash on Delivery", text: "Pay when your parcel arrives" },
            { icon: PackageCheck, title: "Quality Checked", text: "Every piece inspected before dispatch" },
            { icon: MessageCircle, title: "WhatsApp Support", text: "Sizing help & order updates" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {newest.length > 0 && (
        <section className="container-page py-14 sm:py-20">
          <SectionHeading eyebrow="Just in" title="New Arrivals" href="/shop?sort=newest" />
          <ProductGrid products={newest} />
        </section>
      )}

      <section className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-rose-700 px-6 py-12 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gold-500/20 blur-2xl" aria-hidden />
          <p className="font-script text-4xl text-gold-200">Need help choosing?</p>
          <h2 className="mx-auto mt-2 max-w-xl text-3xl text-white sm:text-4xl">
            Ask us about sizes, fabrics or a custom look
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-white/80">
            Our team replies on WhatsApp during store hours. Shipping across India with easy {STORE.returns.windowDays}-day exchange.
          </p>
          <Link href="/help" className="btn btn-gold mt-7">Help & Support</Link>
        </div>
      </section>
    </>
  );
}
