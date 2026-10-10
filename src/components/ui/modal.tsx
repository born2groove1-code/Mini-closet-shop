"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Accessible modal built on the native <dialog> element (focus trap + Esc for free). */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-ivory p-0 text-charcoal shadow-2xl open:animate-slide-up",
        className,
      )}
    >
      <div className="relative p-6 sm:p-8">
        <button type="button" onClick={onClose} className="icon-btn absolute top-3 right-3" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </dialog>
  );
}
