import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { getProductByIdForAdmin } from "@/lib/data/products";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const product = await getProductByIdForAdmin(id);
  if (!product) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="mt-1 text-4xl">Edit product</h1>
        </div>
        {product.isActive && (
          <Link href={`/product/${product.slug}`} target="_blank" className="btn btn-ghost btn-sm border border-line">
            <ExternalLink className="h-4 w-4" /> View in store
          </Link>
        )}
      </div>
      <ProductForm product={product} />
    </div>
  );
}
