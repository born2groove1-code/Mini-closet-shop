/**
 * Boutique details shown across the storefront (footer, Help & Support, emails).
 * Edit these values to match the shop — no code changes needed elsewhere.
 */
export const STORE = {
  name: "Mini Closet",
  owner: "Arti Chandra",
  fullName: "Mini Closet by Arti Chandra",
  tagline: "Ladies Collection — Kurti | Suit | Saree | Cord Set",
  hindiTagline: "हर मौके के लिए, हर उम्र की महिलाओं के लिए…",
  description:
    "Mini Closet by Arti Chandra — a boutique of handpicked kurtis, suits, sarees and cord sets for every occasion, shipped all across India.",
  email: "arti871985@gmail.com",
  phoneDisplay: "+91 95590 97277",
  phoneTel: "+919559097277",
  /** Same number is on WhatsApp. NEXT_PUBLIC_WHATSAPP_NUMBER overrides it if set. */
  whatsapp: "919559097277",
  address: "Mini Closet Boutique, India",
  hours: [
    { days: "Monday – Saturday", time: "10:30 AM – 8:30 PM" },
    { days: "Sunday", time: "11:00 AM – 6:00 PM" },
  ],
  social: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
  shipping: {
    headline: "All India Shipping Available",
    deliveryWindow: "3–7 business days",
    points: [
      "We ship to every serviceable PIN code across India through trusted courier partners.",
      "Orders are dispatched within 1–2 business days after confirmation.",
      "Estimated delivery: 3–7 business days (remote areas may take a little longer).",
      "Free shipping on orders of ₹999 and above; ₹79 flat shipping below that.",
      "You will receive your tracking number on WhatsApp/SMS once the parcel ships.",
    ],
  },
  payment: {
    points: [
      "Cash on Delivery (COD) is available across India.",
      "Our team calls or WhatsApps to verify every COD order before dispatch.",
      "Online payment options are coming soon.",
    ],
  },
  returns: {
    windowDays: 7,
    points: [
      "Exchanges or returns are accepted within 7 days of delivery for unused items with original tags and packaging.",
      "Please share an unboxing video/photos on WhatsApp for any damaged or incorrect item within 48 hours of delivery.",
      "Sale items, customised or altered pieces, and innerwear are not eligible for return.",
      "Refunds for prepaid orders are processed to the original method within 5–7 business days of receiving the return; COD orders are refunded by bank transfer/UPI.",
      "Size exchanges are subject to availability.",
    ],
  },
} as const;
