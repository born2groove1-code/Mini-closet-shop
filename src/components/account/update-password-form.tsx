"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validation";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Invalid password");
    if (password !== confirm) return setError("Passwords do not match.");
    setPending(true);
    setError(null);
    const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setPending(false);
    if (updateError) return setError(updateError.message);
    router.replace("/account?notice=password-updated");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="new-password" className="field-label">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <label htmlFor="confirm-password" className="field-label">Confirm password</label>
        <input id="confirm-password" type="password" autoComplete="new-password" className="field-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending && <Spinner />} Update password
      </button>
    </form>
  );
}
