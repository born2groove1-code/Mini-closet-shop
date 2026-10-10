import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Truck } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { STORE } from "@/lib/store-config";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-gold-200/70 bg-white">
      <div className="bg-rose-700 text-rose-50">
        <div className="container-page grid gap-4 py-5 text-sm sm:grid-cols-3">
          <p className="flex items-center gap-3"><Truck className="h-5 w-5 text-gold-200" aria-hidden /> All India shipping · {STORE.shipping.deliveryWindow}</p>
          <p className="flex items-center gap-3"><span className="font-display text-lg text-gold-200">₹</span> Cash on Delivery available</p>
          <p className="flex items-center gap-3"><span className="font-display text-lg text-gold-200">↺</span> Easy {STORE.returns.windowDays}-day exchange</p>
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-gold-200">
              <Image src="/brand/logo.jpg" alt="" fill sizes="64px" className="scale-[1.12] object-cover" />
            </span>
            <div>
              <p className="font-script text-3xl leading-none text-rose-600">Mini Closet</p>
              <p className="mt-1 text-[11px] tracking-[0.24em] text-gold-600 uppercase">by Arti Chandra</p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">{STORE.description}</p>
          <p lang="hi" className="mt-3 font-hindi text-sm text-rose-700">{STORE.hindiTagline}</p>
        </div>

        <div>
          <h3 className="eyebrow">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-rose-700">{c.plural}</Link>
              </li>
            ))}
            <li><Link href="/shop?sort=newest" className="hover:text-rose-700">New Arrivals</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow">Help</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/help#shipping" className="hover:text-rose-700">Shipping & Delivery</Link></li>
            <li><Link href="/help#returns" className="hover:text-rose-700">Returns & Exchange</Link></li>
            <li><Link href="/help#payment" className="hover:text-rose-700">Cash on Delivery</Link></li>
            <li><Link href="/account/orders" className="hover:text-rose-700">Track my order</Link></li>
            <li><Link href="/help#contact" className="hover:text-rose-700">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow">Visit & Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />{STORE.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden /><a href={`tel:${STORE.phoneTel}`} className="hover:text-rose-700">{STORE.phoneDisplay}</a></li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden /><a href={`mailto:${STORE.email}`} className="hover:text-rose-700">{STORE.email}</a></li>
            {STORE.hours.map((h) => (
              <li key={h.days} className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />{h.days}: {h.time}</li>
            ))}
          </ul>
          <div className="mt-4 flex gap-4 text-sm">
            <a href={STORE.social.instagram} target="_blank" rel="noopener noreferrer" className="text-rose-700 hover:underline">Instagram</a>
            <a href={STORE.social.facebook} target="_blank" rel="noopener noreferrer" className="text-rose-700 hover:underline">Facebook</a>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="container-page py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} {STORE.fullName}. Ladies Collection — Kurti | Suit | Saree | Cord Set.
        </p>
      </div>
    </footer>
  );
}
