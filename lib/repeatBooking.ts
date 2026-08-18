import { Booking } from '@/types';
import { useBookingStore } from '@/store/booking';

/**
 * Pre-fills the booking draft from a past booking so the customer lands on
 * checkout with the same service, preferred worker, and address already
 * selected instead of starting from scratch. Returns the checkout URL to
 * navigate to, or null if the booking has nothing repeatable on it.
 *
 * We only carry over `workerId` as a preference, same as picking a
 * professional on the service page — checkout still runs the normal
 * availability/pricing checks, so a worker who's no longer serviceable just
 * falls back to auto-assign like any other booking.
 */
export function repeatBooking(booking: Booking): string | null {
  const service = booking.items?.[0]?.service;
  if (!service) return null;

  useBookingStore.getState().setDraft({
    serviceId: service.id,
    service,
    workerId: booking.worker?.id,
    address: booking.address,
    notes: booking.notes,
  });

  return `/checkout/${service.id}`;
}
