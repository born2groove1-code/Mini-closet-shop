import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Round boutique badge (public/brand/logo.jpg) with the wordmark. */
export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)} aria-label="Mini Closet by Arti Chandra — home">
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gold-200 transition group-hover:ring-gold-400 sm:h-12 sm:w-12">
        <Image src="/brand/logo.jpg" alt="" fill sizes="48px" className="scale-[1.12] object-cover" priority />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none whitespace-nowrap">
          <span className="font-script text-[1.4rem] leading-none text-rose-600 sm:text-3xl">Mini Closet</span>
          <span className="mt-0.5 text-[9px] font-medium tracking-[0.2em] sm:text-[10px] sm:tracking-[0.24em] text-gold-600 uppercase">by Arti Chandra</span>
        </span>
      )}
    </Link>
  );
}
