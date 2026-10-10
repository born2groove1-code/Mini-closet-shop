"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <p className="font-script text-5xl text-rose-600">Mini Closet</p>
      <h1 className="mt-4 text-3xl sm:text-4xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">
        We couldn&apos;t load this page. Please check your connection and try again.
        {error.digest && <span className="mt-2 block text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
        <Link href="/" className="btn btn-outline">Back to home</Link>
      </div>
    </main>
  );
}
