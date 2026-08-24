import { create } from 'zustand';
import { wishlistApi, favoriteWorkersApi } from '@/lib/api';

interface FavoritesState {
  serviceIds: string[];
  workerIds: string[];
  hydrated: boolean;
  isFavoriteService: (id: string) => boolean;
  isFavoriteWorker: (id: string) => boolean;
  toggleFavoriteService: (id: string) => void;
  toggleFavoriteWorker: (id: string) => void;
  /** Pulls the logged-in customer's favorite ids from the backend. Call once after login/on app load. */
  hydrate: () => Promise<void>;
  /** Resets to empty on logout so the next user doesn't see a previous customer's favorites. */
  reset: () => void;
}

// Favorites are persisted server-side (wishlist + favorite-workers modules)
// so they follow the customer across devices instead of living only in
// this browser's localStorage. We keep a local id cache for instant heart
// icons, updated optimistically, and reconciled with the server on toggle.
export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  serviceIds: [],
  workerIds: [],
  hydrated: false,

  isFavoriteService: (id) => get().serviceIds.includes(id),
  isFavoriteWorker: (id) => get().workerIds.includes(id),

  toggleFavoriteService: (id) => {
    const wasFavorite = get().serviceIds.includes(id);
    set((s) => ({
      serviceIds: wasFavorite ? s.serviceIds.filter((x) => x !== id) : [...s.serviceIds, id],
    }));
    const call = wasFavorite ? wishlistApi.remove(id) : wishlistApi.add(id);
    call.catch(() => {
      // Roll back on failure so the UI doesn't lie about what's actually saved.
      set((s) => ({
        serviceIds: wasFavorite ? [...s.serviceIds, id] : s.serviceIds.filter((x) => x !== id),
      }));
    });
  },

  toggleFavoriteWorker: (id) => {
    const wasFavorite = get().workerIds.includes(id);
    set((s) => ({
      workerIds: wasFavorite ? s.workerIds.filter((x) => x !== id) : [...s.workerIds, id],
    }));
    const call = wasFavorite ? favoriteWorkersApi.remove(id) : favoriteWorkersApi.add(id);
    call.catch(() => {
      set((s) => ({
        workerIds: wasFavorite ? [...s.workerIds, id] : s.workerIds.filter((x) => x !== id),
      }));
    });
  },

  hydrate: async () => {
    try {
      const [servicesRes, workersRes] = await Promise.all([
        wishlistApi.getIds(),
        favoriteWorkersApi.getIds(),
      ]);
      const serviceIds = servicesRes.data.data || servicesRes.data || [];
      const workerIds = workersRes.data.data || workersRes.data || [];
      set({ serviceIds, workerIds, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  reset: () => set({ serviceIds: [], workerIds: [], hydrated: false }),
}));
