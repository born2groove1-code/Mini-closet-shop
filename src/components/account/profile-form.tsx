"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";
import { updateProfile } from "@/lib/actions/account";
import { INDIAN_STATES } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { useUIStore } from "@/stores/ui";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const toast = useUIStore((s) => s.toast);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [values, setValues] = useState({
    fullName: profile?.fullName ?? "",
    phone: profile?.phone ?? "",
    addressLine: profile?.addressLine ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    pincode: profile?.pincode ?? "",
  });

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile(values);
      if (res.ok) {
        setErrors({});
        toast({ tone: "success", title: "Profile saved" });
      } else {
        setErrors(res.fieldErrors ?? {});
        toast({ tone: "error", title: res.error });
      }
    });
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <label htmlFor="pf-name" className="field-label">Full name</label>
        <input id="pf-name" className="field-input" autoComplete="name" value={values.fullName} onChange={set("fullName")} aria-invalid={Boolean(err("fullName"))} />
        {err("fullName") && <p className="field-error">{err("fullName")}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pf-phone" className="field-label">Mobile number</label>
        <input id="pf-phone" type="tel" inputMode="numeric" className="field-input" autoComplete="tel-national" value={values.phone} onChange={set("phone")} aria-invalid={Boolean(err("phone"))} />
        {err("phone") && <p className="field-error">{err("phone")}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pf-address" className="field-label">Address</label>
        <textarea id="pf-address" rows={2} className="field-input resize-none" autoComplete="street-address" value={values.addressLine} onChange={set("addressLine")} />
      </div>
      <div>
        <label htmlFor="pf-city" className="field-label">City</label>
        <input id="pf-city" className="field-input" autoComplete="address-level2" value={values.city} onChange={set("city")} />
      </div>
      <div>
        <label htmlFor="pf-pin" className="field-label">PIN code</label>
        <input id="pf-pin" inputMode="numeric" maxLength={6} className="field-input" autoComplete="postal-code" value={values.pincode}
          onChange={(e) => set("pincode")({ target: { value: e.target.value.replace(/\D/g, "") } })} aria-invalid={Boolean(err("pincode"))} />
        {err("pincode") && <p className="field-error">{err("pincode")}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="pf-state" className="field-label">State</label>
        <select id="pf-state" className="field-input" value={values.state} onChange={set("state")}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <Spinner />} Save profile
        </button>
      </div>
    </form>
  );
}
