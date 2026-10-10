export default function ProductLoading() {
  return (
    <div className="container-page py-6 sm:py-10" aria-busy="true" aria-label="Loading product">
      <div className="skeleton mb-5 h-3 w-48" />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="skeleton aspect-[3/4] w-full rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-8 w-40" />
          <div className="flex gap-2 pt-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="skeleton h-11 w-12 rounded-full" />
            ))}
          </div>
          <div className="skeleton mt-6 h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
