import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { buildChatSystemPrompt, chatRequestSchema } from "@/lib/chat";
import { listProducts } from "@/lib/data/products";

const MODEL = "claude-opus-5-5";

// Best-effort per-IP limit (per server instance) to keep API costs in check.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

/** Shopping-assistant chat. Answers only from store policies and the live catalogue. */
export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "The chat assistant isn't set up yet." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "You're sending messages too quickly. Please wait a minute." }, { status: 429 });
  }

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  try {
    const products = await listProducts().catch(() => []);
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: buildChatSystemPrompt(products),
      messages: parsed.data.messages,
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ reply: "Sorry, I can't help with that. Is there anything about our collection I can help you with?" });
    }

    const reply = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    return NextResponse.json({ reply: reply || "Sorry, I didn't catch that. Could you rephrase?" });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "The assistant is busy. Please try again shortly." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[chat] API error ${error.status}:`, error.message);
    } else {
      console.error("[chat]", error);
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
