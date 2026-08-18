'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api';
import { repeatBooking } from '@/lib/repeatBooking';
import { Booking, BookingStatus } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import {
  CalendarClock, MapPin, ChevronRight, PackageOpen, SlidersHorizontal,
  Search, RotateCcw, X,
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

const TABS: { label: string; value: BookingStatus | 'ALL' }[] = [
  { label: 'Upcoming', value: 'ALL' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
const SORT_LABELS: Record<SortOption, string> = {
  'date-desc': 'Newest first',
  'date-asc': 'Oldest first',
  'amount-desc': 'Amount: High to Low',
  'amount-asc': 'Amount: Low to High',
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [rebookingId, setRebookingId] = useState<string | null>(null);

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  useEffect(() => {
    setLoading(true);
    bookingsApi.getMy(tab === 'ALL' ? undefined : tab)
      .then((res) => setBookings(res.data.data || res.data || []))
      .finally(() => setLoading(false));
  }, [tab]);

  const activeFilterCount = [search.trim(), dateFrom, dateTo].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setSortBy('date-desc');
  };

  const filtered = useMemo(() => {
    let list = tab === 'ALL'
      ? bookings.filter((b) => !['COMPLETED', 'CANCELLED'].includes(b.status))
      : bookings;

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((b) =>
        b.items?.some((it) => it.service?.name?.toLowerCase().includes(q)) ||
        b.worker?.name?.toLowerCase().includes(q) ||
        b.address?.fullAddress?.toLowerCase().includes(q));
    }
    if (dateFrom) {
      const from = startOfDay(parseISO(dateFrom));
      list = list.filter((b) => !isBefore(parseISO(b.scheduledDate), from));
    }
    if (dateTo) {
      const to = endOfDay(parseISO(dateTo));
      list = list.filter((b) => !isAfter(parseISO(b.scheduledDate), to));
    }

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return parseISO(a.scheduledDate).getTime() - parseISO(b.scheduledDate).getTime();
        case 'amount-desc': return b.totalAmount - a.totalAmount;
        case 'amount-asc': return a.totalAmount - b.totalAmount;
        case 'date-desc':
        default: return parseISO(b.scheduledDate).getTime() - parseISO(a.scheduledDate).getTime();
      }
    });

    return list;
  }, [bookings, tab, search, dateFrom, dateTo, sortBy]);

  const handleBookAgain = (e: React.MouseEvent, booking: Booking) => {
    e.preventDefault();
    e.stopPropagation();
    setRebookingId(booking.id);
    const href = repeatBooking(booking);
    if (href) router.push(href);
    else setRebookingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">My bookings</h1>
      <p className="text-slate-500 text-sm mb-6">Track and manage your service requests.</p>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-brand-50 border-brand-200 text-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'}`}
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeFilterCount > 0 && (
            <span className="w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold bg-brand-500 text-white rounded-full">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="card p-4 sm:p-5 mb-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Service, professional, or address..."
                className="input-field pl-9 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">From date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="input-field py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">To date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="input-field py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white w-full focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
                <option key={k} value={k}>{SORT_LABELS[k]}</option>
              ))}
            </select>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-500">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No bookings here"
          description={activeFilterCount > 0 ? 'No bookings match your filters.' : (tab === 'ALL' ? "You don't have any upcoming bookings yet." : `No ${tab.toLowerCase()} bookings.`)}
          action={activeFilterCount > 0
            ? <button onClick={resetFilters} className="btn-primary">Clear filters</button>
            : <Link href="/services" className="btn-primary">Browse services</Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const canRepeat = ['COMPLETED', 'CANCELLED'].includes(b.status) && !!b.items?.[0]?.service;
            return (
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
                  {canRepeat && (
                    <button
                      onClick={(e) => handleBookAgain(e, b)}
                      disabled={rebookingId === b.id}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                    >
                      <RotateCcw className="h-3 w-3" /> Book again
                    </button>
                  )}
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <p className="font-display font-bold text-slate-800">₹{b.totalAmount}</p>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
