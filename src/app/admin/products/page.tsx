import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { InventoryTable } from "@/components/admin/inventory-table";
import { listAllProductsForAdmin } from "@/lib/data/products";

export const metadata = { title: "Inventory" };

export default async function AdminProductsPage() {
  const products = await listAllProductsForAdmin();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="mt-1 text-4xl">Inventory</h1>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <PlusCircle className="h-4 w-4" /> Add product
        </Link>
      </div>
      <InventoryTable products={products} />
    </div>
  );
}
