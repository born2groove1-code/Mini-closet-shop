import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <Logo />
      <p className="mt-10 font-script text-6xl text-rose-600">Oops!</p>
      <h1 className="mt-3 text-4xl">This page has left the closet</h1>
      <p className="mt-3 max-w-md text-muted">
        The product or page you&apos;re looking for may have sold out, moved, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">Shop Collection</Link>
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </main>
  );
}
