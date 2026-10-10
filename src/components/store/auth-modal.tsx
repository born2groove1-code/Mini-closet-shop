"use client";

import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui";
import { AuthForm } from "./auth-form";

/** Inline login / signup used by checkout so guests never lose their bag. */
export function AuthModal() {
  const auth = useUIStore((s) => s.auth);
  const close = useUIStore((s) => s.closeAuth);

  return (
    <Modal open={auth.open} onClose={close} title="Sign in to Mini Closet">
      {auth.reason && (
        <p className="mb-4 rounded-xl bg-gold-50 px-4 py-3 text-sm text-gold-700 ring-1 ring-gold-100">{auth.reason}</p>
      )}
      {auth.open && (
        <AuthForm
          key={`${auth.mode}-${auth.redirectTo}`}
          initialMode={auth.mode}
          redirectTo={auth.redirectTo ?? (typeof window !== "undefined" ? window.location.pathname : "/")}
          onSuccess={close}
        />
      )}
    </Modal>
  );
}
