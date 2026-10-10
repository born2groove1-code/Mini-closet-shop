import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Truck } from "lucide-react";
import { STORE } from "@/lib/store-config";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-rose-50/70 via-ivory to-ivory">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gold-100/60 blur-3xl"
        aria-hidden
      />
      <div className="container-page grid items-center gap-8 py-8 sm:py-12 lg:grid-cols-[1fr_1.15fr] lg:gap-14 lg:py-16">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-soft ring-1 ring-rose-100">
            <Truck className="h-4 w-4 text-gold-600" aria-hidden />
            {STORE.shipping.headline}
          </p>

          <p className="mt-6 font-script text-5xl leading-none text-rose-600 sm:text-6xl">Mini Closet</p>
          <p className="mt-2 text-[11px] font-medium tracking-[0.3em] text-gold-600 uppercase sm:text-xs">
            by Arti Chandra · Ladies Collection
          </p>

          <h1 className="mt-5 text-4xl leading-[1.08] text-charcoal sm:text-5xl lg:text-[3.4rem]">
            Graceful ethnic wear for every celebration
          </h1>
          <p lang="hi" className="mt-4 font-hindi text-lg text-rose-700">{STORE.hindiTagline}</p>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted lg:mx-0">
            Handpicked kurtis, suits, sarees and cord sets — delivered to your doorstep anywhere in India in{" "}
            {STORE.shipping.deliveryWindow}, with Cash on Delivery.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/shop" className="btn btn-primary px-7">
              Shop Collection <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="#featured" className="btn btn-outline px-7">
              Explore Products
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted lg:justify-start">
            {["Cash on Delivery", "Free shipping ₹999+", `${STORE.returns.windowDays}-day exchange`].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-gold-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute -inset-2 rounded-[2rem] border border-gold-200 sm:-inset-3" aria-hidden />
            <div className="relative aspect-[3/2] overflow-hidden rounded-[1.6rem] bg-white shadow-lift">
              <Image
                src="/brand/banner.jpg"
                alt="Mini Closet Ladies Collection — Kurti, Suit, Saree and Cord Set"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
