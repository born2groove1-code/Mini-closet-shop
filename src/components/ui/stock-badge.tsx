import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-charcoal/85 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white uppercase",
          className,
        )}
      >
        Out of Stock
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-medium text-gold-700 ring-1 ring-gold-200",
          className,
        )}
      >
        Only {stock} left
      </span>
    );
  }
  return null;
}
