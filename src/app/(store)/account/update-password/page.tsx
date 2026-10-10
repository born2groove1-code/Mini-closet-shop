import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/account/update-password-form";

export const metadata: Metadata = { title: "Change password", robots: { index: false } };

export default function UpdatePasswordPage() {
  return (
    <section className="card max-w-lg p-6 sm:p-8">
      <h2 className="text-2xl">Set a new password</h2>
      <p className="mt-1 text-sm text-muted">Use at least 8 characters. You&apos;ll stay signed in on this device.</p>
      <UpdatePasswordForm />
    </section>
  );
}
