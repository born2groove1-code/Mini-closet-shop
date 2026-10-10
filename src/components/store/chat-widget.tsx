"use client";

import Link from "next/link";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";
import { CHAT_MAX_CHARS, CHAT_MAX_MESSAGES, type ChatMessage } from "@/lib/chat";

const GREETING = "Hi! 👋 I'm the Mini Closet assistant. Ask me about our kurtis, suits, sarees, sizes, shipping or returns.";
const SUGGESTIONS = ["Show me sarees under ₹3000", "Do you offer Cash on Delivery?", "What is your return policy?"];

// Turns site paths in replies (e.g. /product/blue-kurti) into links.
const PATH_RE = /(\/(?:product\/[a-z0-9-]+|shop|help|account\/orders|wishlist))/g;

function Linkified({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return text.split(PATH_RE).map((part, i) =>
    i % 2 === 1 ? (
      <Link key={i} href={part} onClick={onNavigate} className="font-medium text-rose-600 underline underline-offset-2">
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Floating AI shopping assistant, stacked above the WhatsApp button. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending, open]);

  async function send(text: string) {
    const content = text.trim().slice(0, CHAT_MAX_CHARS);
    if (!content || pending) return;
    const next = [...messages, { role: "user" as const, content }].slice(-CHAT_MAX_MESSAGES);
    // The API requires the history to start with a customer message.
    while (next.length && next[0].role !== "user") next.shift();
    setMessages(next);
    setInput("");
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setMessages(messages);
      setInput(content);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Shopping assistant"
          className="fixed inset-x-3 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+7.5rem)] z-40 flex max-h-[min(32rem,70vh)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift sm:inset-x-auto sm:right-6 sm:bottom-40 sm:w-96"
        >
          <header className="flex items-center justify-between bg-rose-600 px-4 py-3 text-white">
            <div>
              <p className="font-medium">Mini Closet Assistant</p>
              <p className="text-xs text-rose-100">AI answers — may make mistakes</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
            <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ivory-dark px-3 py-2">{GREETING}</p>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-700 hover:bg-rose-50">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-rose-600 px-3 py-2 text-white">
                  {m.content}
                </p>
              ) : (
                <p key={i} className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-ivory-dark px-3 py-2">
                  <Linkified text={m.content} onNavigate={() => setOpen(false)} />
                </p>
              ),
            )}
            {pending && (
              <p className="flex w-fit items-center gap-2 rounded-2xl bg-ivory-dark px-3 py-2 text-muted">
                <Spinner /> Typing…
              </p>
            )}
            {error && <p className="text-xs text-danger" role="alert">{error}</p>}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={CHAT_MAX_CHARS}
              placeholder="Ask a question…"
              aria-label="Your message"
              className="min-w-0 flex-1 rounded-full border border-line px-4 py-2 text-sm outline-none focus:border-rose-300"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        aria-expanded={open}
        className="fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] z-30 flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white shadow-lift transition hover:scale-105 sm:right-6 sm:bottom-24 sm:h-14 sm:w-14"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircleQuestion className="h-6 w-6" />}
      </button>
    </>
  );
}
