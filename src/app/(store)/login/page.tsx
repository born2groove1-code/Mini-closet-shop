import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/store/auth-form";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = safeNextPath(typeof next === "string" ? next : null, "/account");
  if (await getSessionUser()) redirect(target);

  return (
    <div className="container-page flex justify-center py-12 sm:py-20">
      <div className="card w-full max-w-md p-6 shadow-soft sm:p-8">
        <AuthForm initialMode="login" redirectTo={target} />
      </div>
    </div>
  );
}
