"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Lock, ShoppingBag } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/ui/product-image";
import { Spinner } from "@/components/ui/spinner";
import { refreshCartProducts } from "@/lib/actions/cart";
import { placeOrder } from "@/lib/actions/checkout";
import { INDIAN_STATES } from "@/lib/constants";
import { calculateTotals } from "@/lib/pricing";
import { STORE } from "@/lib/store-config";
import type { Profile } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { fieldErrors, shippingSchema } from "@/lib/validation";
import { useCartStore } from "@/stores/cart";
import { useUIStore } from "@/stores/ui";

type Fields = {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

export function CheckoutForm({ profile, email }: { profile: Profile | null; email: string }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s.hydrated);
  const reconcile = useCartStore((s) => s.reconcile);
  const clear = useCartStore((s) => s.clear);
  const toast = useUIStore((s) => s.toast);

  const [fields, setFields] = useState<Fields>({
    fullName: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    addressLine: profile?.addressLine ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    pincode: profile?.pincode ?? "",
    notes: "",
  });
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [placed, setPlaced] = useState(false);

  const { subtotal, shipping, total } = calculateTotals(items);

  async function syncWithServer() {
    const ids = [...new Set(useCartStore.getState().items.map((i) => i.productId))];
    if (!ids.length) return;
    const products = await refreshCartProducts(ids);
    for (const n of reconcile(products)) toast({ tone: "info", title: n.title, description: n.message });
  }

  // Verify the bag against live prices and stock as soon as it's loaded.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    syncWithServer()
      .catch(() => undefined)
      .finally(() => !cancelled && setVerifying(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const set = (key: keyof Fields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = shippingSchema.safeParse(fields);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setSubmitting(true);
    const result = await placeOrder({
      ...parsed.data,
      saveAddress,
      items: items.map((i) => ({ productId: i.productId, size: i.size, quantity: i.quantity })),
    });

    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.error);
      if (result.fieldErrors) setErrors(result.fieldErrors);
      // Stock or price may have changed: refresh the bag so the customer can adjust.
      await syncWithServer().catch(() => undefined);
      return;
    }

    setPlaced(true);
    clear();
    router.replace(`/account/orders/${result.data.orderId}?placed=1`);
  }

  if (!hydrated || placed) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6 text-rose-600" label={placed ? "Opening your order" : "Loading your bag"} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white">
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add a few favourites to your bag and come back to check out."
          action={<Link href="/shop" className="btn btn-primary">Shop Collection</Link>}
        />
      </div>
    );
  }

  const err = (k: keyof Fields) => errors[k]?.[0];

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
      <div className="space-y-8">
        <section className="card p-5 sm:p-7" aria-labelledby="ship-title">
          <h2 id="ship-title" className="text-2xl">Shipping address</h2>
          <p className="mt-1 text-sm text-muted">Signed in as {email}. We deliver across India.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="field-label">Full name *</label>
              <input id="fullName" className="field-input" autoComplete="name" value={fields.fullName} onChange={set("fullName")} aria-invalid={Boolean(err("fullName"))} />
              {err("fullName") && <p className="field-error">{err("fullName")}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="phone" className="field-label">Mobile number *</label>
              <div className="flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-ivory-dark px-3 text-sm text-muted">+91</span>
                <input id="phone" type="tel" inputMode="numeric" className="field-input rounded-l-none" autoComplete="tel-national" maxLength={14}
                  placeholder="10-digit mobile number" value={fields.phone} onChange={set("phone")} aria-invalid={Boolean(err("phone"))} />
              </div>
              {err("phone") ? <p className="field-error">{err("phone")}</p> : <p className="mt-1.5 text-xs text-muted">We&apos;ll call or WhatsApp to verify your COD order.</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressLine" className="field-label">Address (house no., street, area, landmark) *</label>
              <textarea id="addressLine" rows={3} className="field-input resize-none" autoComplete="street-address" value={fields.addressLine} onChange={set("addressLine")} aria-invalid={Boolean(err("addressLine"))} />
              {err("addressLine") && <p className="field-error">{err("addressLine")}</p>}
            </div>
            <div>
              <label htmlFor="city" className="field-label">City *</label>
              <input id="city" className="field-input" autoComplete="address-level2" value={fields.city} onChange={set("city")} aria-invalid={Boolean(err("city"))} />
              {err("city") && <p className="field-error">{err("city")}</p>}
            </div>
            <div>
              <label htmlFor="pincode" className="field-label">PIN code *</label>
              <input id="pincode" inputMode="numeric" maxLength={6} className="field-input" autoComplete="postal-code" value={fields.pincode}
                onChange={(e) => set("pincode")({ target: { value: e.target.value.replace(/\D/g, "") } })} aria-invalid={Boolean(err("pincode"))} />
              {err("pincode") && <p className="field-error">{err("pincode")}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="state" className="field-label">State / Union territory *</label>
              <select id="state" className="field-input" autoComplete="address-level1" value={fields.state} onChange={set("state")} aria-invalid={Boolean(err("state"))}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {err("state") && <p className="field-error">{err("state")}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="field-label">Order notes (optional)</label>
              <input id="notes" className="field-input" placeholder="e.g. call before delivery" value={fields.notes} onChange={set("notes")} maxLength={500} />
            </div>
          </div>
          <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="h-5 w-5 accent-rose-600" />
            Save this address to my profile
          </label>
        </section>

        <section className="card p-5 sm:p-7" aria-labelledby="pay-title">
          <h2 id="pay-title" className="text-2xl">Payment method</h2>
          <div className="mt-5 space-y-3">
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border-2 border-rose-600 bg-rose-50/50 p-4">
              <input type="radio" name="payment" defaultChecked className="mt-1 h-4 w-4 accent-rose-600" />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium"><Banknote className="h-4 w-4 text-rose-600" /> Cash on Delivery</span>
                <span className="mt-1 block text-sm text-muted">Pay in cash or UPI when your parcel arrives. {STORE.payment.points[1]}</span>
              </span>
            </label>
            <div className="flex items-start gap-4 rounded-xl border border-line p-4 opacity-60" aria-disabled="true">
              <input type="radio" name="payment" disabled className="mt-1 h-4 w-4" aria-label="Online payment (coming soon)" />
              <span>
                <span className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4" /> UPI / Cards / Netbanking</span>
                <span className="mt-1 block text-sm text-muted">Coming soon</span>
              </span>
            </div>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <section className="card p-5 sm:p-7" aria-labelledby="summary-title">
          <div className="flex items-center justify-between">
            <h2 id="summary-title" className="text-2xl">Order summary</h2>
            {verifying && <span className="flex items-center gap-2 text-xs text-muted"><Spinner /> Checking stock</span>}
          </div>
          <ul className="mt-5 divide-y divide-line">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="flex gap-3 py-3">
                <span className="relative h-20 w-15 shrink-0 overflow-hidden rounded-lg bg-ivory-dark">
                  <ProductImage src={i.image} alt="" fill sizes="60px" className="object-cover" />
                  <span className="absolute -top-0 -right-0 rounded-bl-lg bg-rose-600 px-1.5 text-[11px] font-medium text-white">×{i.quantity}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-medium">{i.title}</span>
                  <span className="text-xs text-muted">Size {i.size} · {formatINR(i.price)} each</span>
                </span>
                <span className="text-sm font-medium">{formatINR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{shipping === 0 ? <span className="text-success">Free</span> : formatINR(shipping)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><dt>Total (COD)</dt><dd>{formatINR(total)}</dd></div>
          </dl>

          {formError && (
            <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100" role="alert">{formError}</p>
          )}

          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={submitting || verifying}>
            {submitting ? <Spinner /> : <Lock className="h-4 w-4" aria-hidden />}
            {submitting ? "Placing order…" : `Place order · ${formatINR(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Final prices and stock are confirmed securely when you place the order.
          </p>
        </section>
      </aside>
    </form>
  );
}
