import { create } from 'zustand';
import { Service, Address } from '@/types';

interface BookingDraft {
  serviceId?: string;
  service?: Service;
  workerId?: string;
  date?: string;
  time?: string;
  address?: Address;
  notes?: string;
  paymentMethod?: 'UPI' | 'CARD' | 'WALLET' | 'CASH';
  couponCode?: string;
  discount?: number;
}

interface BookingStore {
  draft: BookingDraft;
  setDraft: (data: Partial<BookingDraft>) => void;
  clearDraft: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  draft: {},
  setDraft: (data) => set((s) => ({ draft: { ...s.draft, ...data } })),
  clearDraft: () => set({ draft: {} }),
}));
