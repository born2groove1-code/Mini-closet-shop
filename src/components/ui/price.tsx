import { cn, discountPercent, formatINR } from "@/lib/utils";

export function Price({
  price,
  mrp,
  size = "md",
  className,
}: {
  price: number;
  mrp: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const off = discountPercent(mrp, price);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-semibold text-charcoal",
          size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-sm",
        )}
      >
        {formatINR(price)}
      </span>
      {off > 0 && (
        <>
          <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-sm")}>
            <span className="sr-only">MRP </span>
            {formatINR(mrp)}
          </span>
          <span className={cn("font-medium text-success", size === "lg" ? "text-base" : "text-xs")}>
            {off}% off
          </span>
        </>
      )}
    </div>
  );
}
