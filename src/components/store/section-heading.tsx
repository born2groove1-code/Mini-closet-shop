import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  id,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
  id?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8" id={id}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 text-3xl sm:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-medium text-rose-700 hover:underline">
          {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
