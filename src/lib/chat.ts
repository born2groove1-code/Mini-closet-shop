import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";
import { STORE } from "@/lib/store-config";
import type { Product } from "@/lib/types";

export const CHAT_MAX_MESSAGES = 20;
export const CHAT_MAX_CHARS = 1000;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(CHAT_MAX_CHARS),
      }),
    )
    .min(1)
    .max(CHAT_MAX_MESSAGES)
    .refine((m) => m[0]?.role === "user" && m[m.length - 1]?.role === "user", {
      message: "Conversation must start and end with a customer message.",
    }),
});

export type ChatMessage = z.infer<typeof chatRequestSchema>["messages"][number];

function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

function productLine(p: Product) {
  const stock = p.stock > 0 ? `in stock (${p.stock})` : "out of stock";
  const sizes = p.sizes.length ? p.sizes.join(", ") : "n/a";
  return `- ${p.title} | ${categoryLabel(p.category)} | ₹${p.price} (MRP ₹${p.mrp}) | sizes: ${sizes} | ${stock} | fabric: ${p.fabric || "n/a"} | link: /product/${p.slug}`;
}

/** System prompt for the shopping assistant: boutique policies plus the live catalogue. */
export function buildChatSystemPrompt(products: Product[]) {
  const catalogue = products.length ? products.map(productLine).join("\n") : "(The catalogue is empty right now.)";
  return `You are the friendly shopping assistant for ${STORE.fullName}, an Indian online boutique (${STORE.tagline}).

Answer customer questions about products, sizes, prices, shipping, payment, returns and orders. Keep replies short (2–5 sentences), warm and clear. Reply in the customer's language; Hindi and Hinglish are welcome.

Rules:
- Use only the facts below. If you don't know something (e.g. a measurement chart, a specific order's status), say so and suggest WhatsApp or the Help & Support page (/help).
- When recommending products, give the name, price and its link path exactly as listed (e.g. /product/some-slug). Never invent products, prices, discounts or stock.
- Customers can track and cancel pending orders under My Orders (/account/orders).
- Only discuss the boutique and shopping. Politely decline anything unrelated.

Store details:
- Email: ${STORE.email} · Phone: ${STORE.phoneDisplay}
- Hours: ${STORE.hours.map((h) => `${h.days} ${h.time}`).join("; ")}

Shipping (${STORE.shipping.deliveryWindow}):
${STORE.shipping.points.map((p) => `- ${p}`).join("\n")}

Payment:
${STORE.payment.points.map((p) => `- ${p}`).join("\n")}

Returns & exchange (${STORE.returns.windowDays} days):
${STORE.returns.points.map((p) => `- ${p}`).join("\n")}

Current catalogue:
${catalogue}`;
}
