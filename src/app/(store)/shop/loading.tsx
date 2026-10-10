import { ProductGridSkeleton } from "@/components/store/product-card";

export default function ShopLoading() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true" aria-label="Loading products">
      <div className="skeleton h-3 w-28" />
      <div className="skeleton mt-4 h-10 w-72" />
      <div className="skeleton mt-3 mb-8 h-4 w-96 max-w-full" />
      <div className="lg:grid lg:grid-cols-[264px_1fr] lg:gap-8">
        <div className="skeleton hidden h-96 lg:block" />
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
