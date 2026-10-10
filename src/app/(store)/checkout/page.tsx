import type { Metadata } from "next";
import { BackendRequired } from "@/components/store/backend-required";
import { CheckoutForm } from "@/components/store/checkout-form";
import { requireUser } from "@/lib/auth";
import { getMyProfile } from "@/lib/data/orders";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  if (!isSupabaseConfigured) return <BackendRequired feature="Checkout" />;

  // Mandatory authentication (the proxy redirects guests too; this is the server-side guarantee).
  const user = await requireUser("/checkout");
  const profile = await getMyProfile(user.id);

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="eyebrow">Secure checkout</p>
      <h1 className="mt-1 mb-8 text-4xl sm:text-5xl">Checkout</h1>
      <CheckoutForm profile={profile} email={user.email} />
    </div>
  );
}
