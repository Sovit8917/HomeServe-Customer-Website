'use client';
import { AlarmClockOff } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Surfaces Booking.runningLateAt / runningLateReason — set when the
 * worker reports they'll miss the scheduled slot. Purely informational;
 * the customer's own remedies (cancel, SOS, reschedule) already live
 * elsewhere on this page.
 */
export default function RunningLateBanner({ at, reason }: { at: string; reason?: string }) {
  return (
    <div className="card p-5 mb-4 bg-amber-50 border-amber-200">
      <div className="flex items-start gap-3">
        <AlarmClockOff className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Your professional is running late</p>
          <p className="text-xs text-amber-700 mt-0.5">
            {reason || "They'll be with you as soon as possible."}
          </p>
          <p className="text-[11px] text-amber-500 mt-1">
            Reported {formatDistanceToNow(parseISO(at), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
