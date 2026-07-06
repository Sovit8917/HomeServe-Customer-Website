'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { Booking, BookingStatus } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { CalendarClock, MapPin, ChevronRight, PackageOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const TABS: { label: string; value: BookingStatus | 'ALL' }[] = [
  { label: 'Upcoming', value: 'ALL' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    setLoading(true);
    bookingsApi.getMy(tab === 'ALL' ? undefined : tab)
      .then((res) => setBookings(res.data.data || res.data || []))
      .finally(() => setLoading(false));
  }, [tab]);

  const filtered = tab === 'ALL'
    ? bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status))
    : bookings;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">My bookings</h1>
      <p className="text-slate-500 text-sm mb-6">Track and manage your service requests.</p>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No bookings here"
          description={tab === 'ALL' ? "You don't have any upcoming bookings yet." : `No ${tab.toLowerCase()} bookings.`}
          action={<Link href="/services" className="btn-primary">Browse services</Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="card p-4 sm:p-5 flex items-center gap-4 hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <CalendarClock className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-slate-900 truncate">{b.items?.[0]?.service?.name || 'Service booking'}</p>
                  <Badge status={b.status} />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-0.5">
                  <CalendarClock className="h-3 w-3" /> {format(parseISO(b.scheduledDate), 'EEE, MMM d')} • {b.scheduledTime}
                </p>
                {b.address && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 flex-shrink-0" /> {b.address.fullAddress}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <p className="font-display font-bold text-slate-800">₹{b.totalAmount}</p>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
