import type { Metadata } from "next";
import { Banknote, Clock, Mail, MessageCircle, Phone, RefreshCw, Truck } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { STORE } from "@/lib/store-config";
import { GENERAL_INQUIRY_MESSAGE, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Help & Support",
  description: "Shipping across India, Cash on Delivery, returns & exchange policy, store hours and contact details.",
};

const FAQ = [
  {
    q: "How do I choose my size?",
    a: "Each product lists its available sizes. If you are between sizes, message us on WhatsApp with your measurements and we will help you pick the best fit.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "You can cancel from My Orders while the order is still pending. Once confirmed, please WhatsApp us and we will do our best to help.",
  },
  {
    q: "How will I know my order has shipped?",
    a: "Your order page updates to “Shipped” with a tracking number, and we share tracking details on WhatsApp/SMS.",
  },
];

export default function HelpPage() {
  const wa = whatsappLink(GENERAL_INQUIRY_MESSAGE);

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">We&apos;re here to help</p>
        <h1 className="mt-1 text-4xl sm:text-5xl">Help & Support</h1>
        <p className="mt-3 text-muted">Shipping, Cash on Delivery, returns, store hours and how to reach us.</p>
      </header>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
        <section id="shipping" className="card scroll-mt-40 p-6 sm:p-8">
          <h2 className="flex items-center gap-3 text-2xl"><Truck className="h-6 w-6 text-rose-600" aria-hidden />{STORE.shipping.headline}</h2>
          <p className="mt-2 text-sm font-medium text-gold-700">Estimated delivery: {STORE.shipping.deliveryWindow}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-gold-500">
            {STORE.shipping.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </section>

        <section id="returns" className="card scroll-mt-40 p-6 sm:p-8">
          <h2 className="flex items-center gap-3 text-2xl"><RefreshCw className="h-6 w-6 text-rose-600" aria-hidden />Returns & Exchange</h2>
          <p className="mt-2 text-sm font-medium text-gold-700">{STORE.returns.windowDays}-day easy exchange</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-gold-500">
            {STORE.returns.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </section>

        <section id="payment" className="card scroll-mt-40 p-6 sm:p-8">
          <h2 className="flex items-center gap-3 text-2xl"><Banknote className="h-6 w-6 text-rose-600" aria-hidden />Cash on Delivery</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-gold-500">
            {STORE.payment.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </section>

        <section id="contact" className="card scroll-mt-40 p-6 sm:p-8">
          <h2 className="flex items-center gap-3 text-2xl"><MessageCircle className="h-6 w-6 text-rose-600" aria-hidden />Contact & Store Hours</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3"><Phone className="h-4 w-4 text-rose-600" aria-hidden /><a href={`tel:${STORE.phoneTel}`} className="hover:text-rose-700">{STORE.phoneDisplay}</a><span className="text-muted">(Call &amp; WhatsApp)</span></li>
            <li className="flex gap-3"><Mail className="h-4 w-4 text-rose-600" aria-hidden /><a href={`mailto:${STORE.email}`} className="hover:text-rose-700">{STORE.email}</a></li>
            {STORE.hours.map((h) => (
              <li key={h.days} className="flex gap-3"><Clock className="h-4 w-4 text-rose-600" aria-hidden /><span><span className="font-medium">{h.days}:</span> {h.time}</span></li>
            ))}
          </ul>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-6 w-full bg-[#25D366] text-white hover:bg-[#1fb457]">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          ) : (
            <p className="mt-6 rounded-xl bg-ivory-dark px-4 py-3 text-sm text-muted">
              WhatsApp chat will appear here once the store number is configured.
            </p>
          )}
        </section>
      </div>

      <section className="mx-auto mt-12 max-w-3xl" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-center text-3xl">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {f.q}
                <span className="text-xl text-gold-600 transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
