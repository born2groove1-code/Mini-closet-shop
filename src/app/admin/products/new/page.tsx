import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add product" };

export default function NewProductPage() {
  return (
    <div>
      <p className="eyebrow">Products</p>
      <h1 className="mt-1 mb-6 text-4xl">Add a new product</h1>
      <ProductForm />
    </div>
  );
}
