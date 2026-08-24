'use client';
import { useEffect, useState } from 'react';
import { X, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { bookingsApi } from '@/lib/api';
import { BookingTimeline, BookingTimelineEventType } from '@/types';
import Spinner from '@/components/ui/Spinner';

const DOT_STYLES: Record<BookingTimelineEventType, string> = {
  CREATED: 'bg-slate-400',
  WORKER_DECLINED: 'bg-slate-300',
  ACCEPTED: 'bg-brand-500',
  RESCHEDULED: 'bg-blue-500',
  RUNNING_LATE: 'bg-amber-500',
  REASSIGNED_NO_SHOW: 'bg-amber-500',
  STARTED: 'bg-brand-500',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
  REJECTED: 'bg-red-500',
};

export default function BookingTimelineModal({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const [timeline, setTimeline] = useState<BookingTimeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingsApi.getTimeline(bookingId)
      .then((res) => setTimeline(res.data.data || res.data))
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-brand-500" /> Booking timeline
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !timeline || timeline.events.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No events yet.</p>
          ) : (
            <ol className="relative">
              {timeline.events.map((ev, i) => (
                <li key={i} className="relative pl-7 pb-6 last:pb-0">
                  {i < timeline.events.length - 1 && (
                    <span className="absolute left-[7px] top-3 bottom-0 w-px bg-slate-100" />
                  )}
                  <span className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${DOT_STYLES[ev.type] || 'bg-slate-400'}`} />
                  <p className="text-sm font-medium text-slate-800">{ev.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{format(parseISO(ev.at), 'MMM d, yyyy · h:mm a')}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
