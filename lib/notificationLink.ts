import { Notification } from '@/types';

/**
 * Resolves where tapping a notification should take the user.
 *
 * The backend attaches a `data` payload to every notification (see
 * NotificationsService.create / notifications.listener.ts) — most carry a
 * `bookingId`, some carry a `disputeId` or `extraTimeRequestId` alongside it,
 * a couple carry a `serviceId`. We prefer the most specific target available
 * so, e.g., a dispute-resolved notification opens the dispute itself rather
 * than just the booking the dispute is about.
 *
 * Returns null when there's nowhere sensible to deep-link to (e.g. a
 * withdrawal or admin-approval notification with no attached entity) — the
 * caller should just mark it read without navigating.
 */
export function resolveNotificationLink(notification: Notification): string | null {
  const type = notification.type || '';
  const data = notification.data || {};

  // Chat message notifications go straight to the conversation.
  if (type === 'NEW_MESSAGE' && data.bookingId) {
    return `/bookings/${data.bookingId}/chat`;
  }
  if (type === 'PREBOOKING_MESSAGE' && data.workerId) {
    return `/chat/${data.workerId}`;
  }

  // Dispute lifecycle — open the dispute thread itself.
  if (type.startsWith('DISPUTE') || type.includes('dispute')) {
    if (data.disputeId) return `/disputes/${data.disputeId}`;
    if (data.bookingId) return `/bookings/${data.bookingId}`;
  }

  // Extra-charge / extra-time requests live inside the booking detail page,
  // as a card the customer approves/rejects/pays from. `requestId` tells
  // that page which card to scroll to and briefly highlight.
  if (data.extraTimeRequestId && data.bookingId) {
    return `/bookings/${data.bookingId}?requestId=${data.extraTimeRequestId}`;
  }
  if (data.extraChargeRequestId && data.bookingId) {
    return `/bookings/${data.bookingId}?requestId=${data.extraChargeRequestId}`;
  }

  // Anything else tied to a booking (accepted, started, completed,
  // cancelled, rescheduled, running late, etc.) just opens that booking.
  if (data.bookingId) {
    return `/bookings/${data.bookingId}`;
  }

  // Service view reminders point back at the service page.
  if (data.serviceId) {
    return `/services/${data.serviceId}`;
  }

  // General/banner/admin broadcasts have nothing specific to open.
  return null;
}
