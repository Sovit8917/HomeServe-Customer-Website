import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  serviceIds: string[];
  workerIds: string[];
  isFavoriteService: (id: string) => boolean;
  isFavoriteWorker: (id: string) => boolean;
  toggleFavoriteService: (id: string) => void;
  toggleFavoriteWorker: (id: string) => void;
}

// The backend has no favorites endpoints yet, so this lives entirely on the
// device (localStorage) — same pattern as the booking draft store, just
// persisted so it survives reloads.
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      serviceIds: [],
      workerIds: [],
      isFavoriteService: (id) => get().serviceIds.includes(id),
      isFavoriteWorker: (id) => get().workerIds.includes(id),
      toggleFavoriteService: (id) =>
        set((s) => ({
          serviceIds: s.serviceIds.includes(id)
            ? s.serviceIds.filter((x) => x !== id)
            : [...s.serviceIds, id],
        })),
      toggleFavoriteWorker: (id) =>
        set((s) => ({
          workerIds: s.workerIds.includes(id)
            ? s.workerIds.filter((x) => x !== id)
            : [...s.workerIds, id],
        })),
    }),
    { name: 'favorites-store' }
  )
);
