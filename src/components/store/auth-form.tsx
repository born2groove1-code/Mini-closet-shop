"use client";

import { useRouter } from "next/navigation";
import { Eye, EyeOff, MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Spinner } from "@/components/ui/spinner";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn, safeNextPath } from "@/lib/utils";
import { emailSchema, fieldErrors, loginSchema, signupSchema } from "@/lib/validation";

export type AuthFormMode = "login" | "signup" | "forgot";

type Errors = Partial<Record<"fullName" | "email" | "password" | "form", string>>;

function friendlyAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect e-mail or password.";
  if (m.includes("email not confirmed")) return "Please confirm your e-mail first — check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "An account with this e-mail already exists. Please sign in.";
  }
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

export function AuthForm({
  initialMode = "login",
  redirectTo,
  onSuccess,
  onModeChange,
}: {
  initialMode?: AuthFormMode;
  redirectTo?: string | null;
  onSuccess?: () => void;
  onModeChange?: (mode: AuthFormMode) => void;
}) {
  const router = useRouter();
  const [mode, setModeState] = useState<AuthFormMode>(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);
  const next = safeNextPath(redirectTo, "/");

  function setMode(m: AuthFormMode) {
    setModeState(m);
    setErrors({});
    onModeChange?.(m);
  }

  function callbackUrl(path: string) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrors({ form: "Sign-in is disabled in preview mode. Add your Supabase keys to enable accounts." });
      return;
    }
    setErrors({});
    const supabase = getSupabaseBrowserClient();

    if (mode === "forgot") {
      const parsed = emailSchema.safeParse(email);
      if (!parsed.success) return setErrors({ email: parsed.error.issues[0]?.message });
      setPending(true);
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: callbackUrl("/account/update-password"),
      });
      setPending(false);
      if (error) return setErrors({ form: friendlyAuthError(error.message) });
      setSentTo({ email: parsed.data, kind: "reset" });
      return;
    }

    if (mode === "login") {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) {
        const f = fieldErrors(parsed.error);
        return setErrors({ email: f.email?.[0], password: f.password?.[0] });
      }
      setPending(true);
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setPending(false);
      if (error) return setErrors({ form: friendlyAuthError(error.message) });
      onSuccess?.();
      router.push(next);
      router.refresh();
      return;
    }

    const parsed = signupSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      const f = fieldErrors(parsed.error);
      return setErrors({ fullName: f.fullName?.[0], email: f.email?.[0], password: f.password?.[0] });
    }
    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: callbackUrl(next),
      },
    });
    setPending(false);
    if (error) return setErrors({ form: friendlyAuthError(error.message) });
    if (data.user && data.user.identities?.length === 0) {
      return setErrors({ form: "An account with this e-mail already exists. Please sign in." });
    }
    if (data.session) {
      // E-mail confirmation is disabled in Supabase: signed in immediately.
      onSuccess?.();
      router.push(next);
      router.refresh();
      return;
    }
    setSentTo({ email: parsed.data.email, kind: "confirm" });
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold-200">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="text-3xl">Check your inbox</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {sentTo.kind === "confirm"
            ? "We sent a confirmation link to "
            : "We sent a password reset link to "}
          <strong className="text-charcoal">{sentTo.email}</strong>.{" "}
          {sentTo.kind === "confirm" && "Open it on this device to finish signing up — your bag will be waiting."}
        </p>
        <button type="button" className="btn btn-outline mt-6" onClick={() => { setSentTo(null); setMode("login"); }}>
          Back to sign in
        </button>
      </div>
    );
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password";

  return (
    <div>
      <p className="eyebrow">Mini Closet</p>
      <h2 className="mt-1 text-3xl">{title}</h2>

      {mode !== "forgot" && (
        <div className="mt-5 grid grid-cols-2 rounded-full bg-ivory-dark p-1 text-sm" role="tablist" aria-label="Account">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "min-h-10 rounded-full font-medium transition",
                mode === m ? "bg-white text-rose-700 shadow-soft" : "text-muted hover:text-charcoal",
              )}
            >
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        {mode === "signup" && (
          <div>
            <label htmlFor="auth-name" className="field-label">Full name</label>
            <input id="auth-name" className="field-input" autoComplete="name" value={fullName}
              onChange={(e) => setFullName(e.target.value)} aria-invalid={Boolean(errors.fullName)} />
            {errors.fullName && <p className="field-error">{errors.fullName}</p>}
          </div>
        )}
        <div>
          <label htmlFor="auth-email" className="field-label">E-mail</label>
          <input id="auth-email" type="email" inputMode="email" className="field-input" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        {mode !== "forgot" && (
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="auth-password" className="field-label">Password</label>
              {mode === "login" && (
                <button type="button" onClick={() => setMode("forgot")} className="mb-1.5 text-xs text-rose-700 hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input id="auth-password" type={showPassword ? "text" : "password"} className="field-input pr-12"
                autoComplete={mode === "login" ? "current-password" : "new-password"} value={password}
                onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errors.password)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-charcoal"
                aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password}</p>}
            {mode === "signup" && !errors.password && <p className="mt-1.5 text-xs text-muted">At least 8 characters.</p>}
          </div>
        )}

        {errors.form && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100" role="alert">
            {errors.form}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending && <Spinner />}
          {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </button>

        {mode === "forgot" && (
          <button type="button" className="btn btn-ghost w-full" onClick={() => setMode("login")}>
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
