import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WishlistState = {
  ids: string[];
  /** Set when the list is backed by the signed-in user's database rows. */
  userId: string | null;
  setFromServer: (userId: string | null, ids: string[]) => void;
  toggleLocal: (productId: string) => boolean;
  remove: (productId: string) => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      userId: null,
      setFromServer: (userId, ids) => set({ userId, ids: [...new Set(ids)] }),
      toggleLocal: (productId) => {
        const has = get().ids.includes(productId);
        set({ ids: has ? get().ids.filter((id) => id !== productId) : [productId, ...get().ids] });
        return !has;
      },
      remove: (productId) => set({ ids: get().ids.filter((id) => id !== productId) }),
    }),
    {
      name: "mini-closet-wishlist",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
