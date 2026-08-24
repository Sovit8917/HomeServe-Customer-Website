import { create } from 'zustand';
import { cartApi } from '@/lib/api';

interface CartState {
  itemCount: number;
  refresh: () => Promise<void>;
  reset: () => void;
}

// The cart itself lives on the backend (persists across devices/sessions);
// this store just caches the item count so the Navbar badge doesn't need
// its own fetch/loading dance. The cart page re-fetches full details itself.
export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  refresh: async () => {
    try {
      const res = await cartApi.get();
      const data = res.data.data || res.data || {};
      set({ itemCount: data.itemCount || 0 });
    } catch {
      // leave the last known count as-is
    }
  },
  reset: () => set({ itemCount: 0 }),
}));
