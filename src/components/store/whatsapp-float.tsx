"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { buildProductInquiryMessage, GENERAL_INQUIRY_MESSAGE, whatsappLink } from "@/lib/whatsapp";
import { useUIStore } from "@/stores/ui";

/**
 * Persistent WhatsApp button. On a product page it pre-fills the product name
 * and selected size; elsewhere it uses the general order/shopping message.
 */
export function WhatsAppFloat() {
  const inquiry = useUIStore((s) => s.inquiry);
  const pathname = usePathname();
  const [hint, setHint] = useState(false);

  const onProductPage = pathname.startsWith("/product/") && inquiry;
  const message = onProductPage
    ? buildProductInquiryMessage(inquiry.productName, inquiry.size)
    : GENERAL_INQUIRY_MESSAGE;
  const href = whatsappLink(message);

  const base =
    "fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lift transition hover:scale-105 sm:h-14 sm:w-14 sm:right-6 sm:bottom-6";

  if (!href) {
    // Fallback indicator: NEXT_PUBLIC_WHATSAPP_NUMBER is not configured.
    return (
      <div className="fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
        {hint && (
          <p className="max-w-56 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted shadow-soft" role="status">
            WhatsApp chat isn&apos;t set up yet. Visit Help & Support for other ways to reach us.
          </p>
        )}
        <Link
          href="/help"
          onMouseEnter={() => setHint(true)}
          onMouseLeave={() => setHint(false)}
          onFocus={() => setHint(true)}
          onBlur={() => setHint(false)}
          className="relative flex h-12 w-12 items-center justify-center rounded-full bg-muted/70 sm:h-14 sm:w-14 text-white shadow-soft"
          aria-label="WhatsApp not configured — open Help & Support"
        >
          <WhatsAppIcon className="h-7 w-7" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-ivory bg-gold-500" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} bg-[#25D366] text-white`}
      aria-label={onProductPage ? `Ask about ${inquiry.productName} on WhatsApp` : "Chat with Mini Closet on WhatsApp"}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
