'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { recurringBookingsApi, servicesApi } from '@/lib/api';
import { RecurringBooking, Service } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Repeat, ChevronLeft, Calendar, Clock, Pause, Play, SkipForward, XCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY: 'Every week',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Every month',
};

export default function RecurringBookingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<RecurringBooking[]>([]);
  const [servicesById, setServicesById] = useState<Record<string, Service>>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([recurringBookingsApi.getMy(), servicesApi.getAll()])
      .then(([recRes, svcRes]) => {
        const recurring: RecurringBooking[] = recRes.data.data || recRes.data || [];
        setItems(recurring);
        const services: Service[] = svcRes.data.data || svcRes.data || [];
        setServicesById(Object.fromEntries(services.map((s) => [s.id, s])));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: 'pause' | 'resume' | 'skipNext' | 'cancel') => {
    if (action === 'cancel' && !window.confirm('Cancel this recurring booking permanently? This cannot be undone.')) return;
    setActingId(id);
    try {
      await recurringBookingsApi[action](id);
      toast.success(
        action === 'pause' ? 'Paused' :
        action === 'resume' ? 'Resumed' :
        action === 'skipNext' ? 'Next occurrence skipped' : 'Recurring booking cancelled'
      );
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update this recurring booking');
    } finally {
      setActingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Recurring bookings</h1>
      <p className="text-slate-500 text-sm mb-6">Services that book themselves automatically on a schedule.</p>

      {items.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring bookings yet"
          description="Set up a recurring booking from any service's checkout page to have it book automatically on a schedule."
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const names = r.items.map((i) => servicesById[i.serviceId]?.name || 'Service').join(', ');
            return (
              <div key={r.id} className="card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{names}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> {FREQUENCY_LABEL[r.frequency] || r.frequency}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.scheduledTime}</span>
                    </div>
                  </div>
                  <span className={`badge flex-shrink-0 ${r.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {r.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
                  <Calendar className="h-4 w-4 text-brand-500" />
                  Next: {format(parseISO(r.nextRunDate), 'EEE, MMM d, yyyy')}
                </div>

                {r.lastRunError && (
                  <div className="flex items-start gap-1.5 text-xs text-amber-600 mb-3">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    Last run failed: {r.lastRunError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  {r.isActive ? (
                    <>
                      <button disabled={actingId === r.id} onClick={() => act(r.id, 'skipNext')}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50">
                        <SkipForward className="h-3.5 w-3.5" /> Skip next
                      </button>
                      <button disabled={actingId === r.id} onClick={() => act(r.id, 'pause')}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50">
                        <Pause className="h-3.5 w-3.5" /> Pause
                      </button>
                    </>
                  ) : (
                    <button disabled={actingId === r.id} onClick={() => act(r.id, 'resume')}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50">
                      <Play className="h-3.5 w-3.5" /> Resume
                    </button>
                  )}
                  <button disabled={actingId === r.id} onClick={() => act(r.id, 'cancel')}
                    className="text-xs py-1.5 px-3 flex items-center gap-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                    <XCircle className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
