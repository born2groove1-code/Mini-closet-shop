"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { Spinner } from "@/components/ui/spinner";
import { categoryLabel } from "@/lib/constants";
import type { ProductSummary } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

/** Header search with live, debounced suggestions (title, category). */
export function SearchBar({ className, autoFocus = false, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (res.ok) {
          const json = (await res.json()) as { results: ProductSummary[] };
          setResults(json.results);
          setActive(-1);
        }
      } catch {
        /* aborted or offline */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const term = q.trim();
  const showPanel = open && term.length >= 2;

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (active >= 0 && results[active]) return go(`/product/${results[active].slug}`);
    go(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">Search products</label>
        <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (e.target.value.trim().length < 2) setResults([]);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search kurtis, sarees, suits…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-11 w-full rounded-full border border-line bg-white pr-10 pl-10 text-[15px] placeholder:text-muted/80 focus:border-rose-600 focus:ring-3 focus:ring-rose-600/10 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-ivory-dark"
            aria-label="Clear search"
          >
            {loading ? <Spinner /> : <X className="h-4 w-4" />}
          </button>
        )}
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 animate-fade-in overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-muted">
              {loading ? "Searching…" : <>No matches for “{term}”. Try “kurti” or “silk”.</>}
            </p>
          ) : (
            <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((p, i) => (
                <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={`/product/${p.slug}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn("flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50", i === active && "bg-rose-50")}
                  >
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                      <ProductImage src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="text-xs text-muted">{categoryLabel(p.category)}</span>
                    </span>
                    <span className="text-sm font-semibold">{formatINR(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => go(`/shop?q=${encodeURIComponent(term)}`)}
            className="block w-full border-t border-line bg-ivory px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            See all results for “{term}”
          </button>
        </div>
      )}
    </div>
  );
}
