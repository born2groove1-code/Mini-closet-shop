import { env } from "./env";

export function buildProductInquiryMessage(productName: string, size?: string | null) {
  return `Hi Mini Closet, I am interested in inquiring about ${productName} (Size: ${size || "Not selected"})`;
}

export const GENERAL_INQUIRY_MESSAGE =
  "Hi Mini Closet, I have an inquiry regarding my order / shopping.";

export function buildOrderInquiryMessage(orderLabel: string) {
  return `Hi Mini Closet, I have an inquiry regarding my order ${orderLabel}.`;
}

/** Returns a wa.me link, or null when NEXT_PUBLIC_WHATSAPP_NUMBER is not configured. */
export function whatsappLink(message: string, number: string = env.whatsappNumber) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // Assume an Indian number when only the 10-digit mobile is given.
  const international = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
