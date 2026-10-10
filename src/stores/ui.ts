import { create } from "zustand";

export type AuthMode = "login" | "signup";

type Toast = { id: number; title: string; description?: string; tone: "success" | "error" | "info" };

type UIState = {
  cartOpen: boolean;
  /** Increments on every open; lets the drawer revalidate once per opening. */
  cartOpenCount: number;
  openCart: () => void;
  closeCart: () => void;

  auth: { open: boolean; mode: AuthMode; redirectTo: string | null; reason: string | null };
  openAuth: (opts?: { mode?: AuthMode; redirectTo?: string; reason?: string }) => void;
  closeAuth: () => void;

  /** Product context for the floating WhatsApp button's prefilled message. */
  inquiry: { productName: string; size: string | null } | null;
  setInquiry: (inquiry: { productName: string; size: string | null } | null) => void;

  toasts: Toast[];
  toast: (t: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] }) => void;
  dismissToast: (id: number) => void;
};

let toastId = 0;

export const useUIStore = create<UIState>()((set, get) => ({
  cartOpen: false,
  cartOpenCount: 0,
  openCart: () => set({ cartOpen: true, cartOpenCount: get().cartOpenCount + 1 }),
  closeCart: () => set({ cartOpen: false }),

  auth: { open: false, mode: "login", redirectTo: null, reason: null },
  openAuth: (opts) =>
    set({
      cartOpen: false,
      auth: {
        open: true,
        mode: opts?.mode ?? "login",
        redirectTo: opts?.redirectTo ?? null,
        reason: opts?.reason ?? null,
      },
    }),
  closeAuth: () => set({ auth: { ...get().auth, open: false } }),

  inquiry: null,
  setInquiry: (inquiry) => set({ inquiry }),

  toasts: [],
  toast: ({ tone = "info", ...t }) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts.slice(-2), { id, tone, ...t }] });
    setTimeout(() => get().dismissToast(id), 4500);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
