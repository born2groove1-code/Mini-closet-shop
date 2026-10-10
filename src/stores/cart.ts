import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addToCart,
  reconcileCart,
  setLineQuantity,
  type AddResult,
  type CartItem,
} from "@/lib/cart-logic";
import type { ProductSummary } from "@/lib/types";

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity: number) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  reconcile: (products: ProductSummary[]) => ReturnType<typeof reconcileCart>["notices"];
};

/** Bag persisted to localStorage so it survives reloads and the login flow. */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      add: (item, quantity) => {
        const result = addToCart(get().items, item, quantity);
        if (result.added > 0) set({ items: result.items });
        return result;
      },
      setQuantity: (key, quantity) => set({ items: setLineQuantity(get().items, key, quantity) }),
      remove: (key) => set({ items: setLineQuantity(get().items, key, 0) }),
      clear: () => set({ items: [] }),
      reconcile: (products) => {
        const { items, notices } = reconcileCart(get().items, products);
        set({ items });
        return notices;
      },
    }),
    {
      name: "mini-closet-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCartStore.setState({ hydrated: true });
      },
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
