'use client';
import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { format, addDays, isToday } from 'date-fns';
import { bookingsApi, workersApi } from '@/lib/api';
import { AvailabilitySlot } from '@/types';
import toast from 'react-hot-toast';

const FALLBACK_TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function RescheduleModal({ bookingId, workerId, onClose, onDone }: {
  bookingId: string; workerId?: string; onClose: () => void; onDone: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    if (!workerId) { setSlots(null); return; }
    setLoadingSlots(true);
    workersApi.getAvailabilitySlots(workerId, dateStr)
      .then((res) => {
        const data = res.data.data || res.data;
        setSlots(data?.slots || []);
        setSelectedTime('');
      })
      .catch(() => setSlots(null))
      .finally(() => setLoadingSlots(false));
  }, [workerId, dateStr]);

  const availableSlots = slots ?? FALLBACK_TIME_SLOTS.map((time) => ({ time, status: 'FREE' as const, declineRisk: 'LOW' as const }));

  const handleSubmit = async () => {
    if (!selectedTime) return toast.error('Please select a time slot');
    setSubmitting(true);
    try {
      await bookingsApi.reschedule(bookingId, dateStr, selectedTime);
      toast.success('Booking rescheduled');
      onDone();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">Reschedule booking</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-3">Pick a new date and time.</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {next7Days.map((d) => (
              <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 w-14 py-2 rounded-xl border text-center transition-colors ${format(d, 'yyyy-MM-dd') === dateStr ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'}`}>
                <p className="text-[10px] opacity-80">{isToday(d) ? 'Today' : format(d, 'EEE')}</p>
                <p className="font-semibold text-sm">{format(d, 'd')}</p>
              </button>
            ))}
          </div>
          {loadingSlots ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-brand-400" /></div>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {availableSlots.map((s) => {
                const disabled = s.status !== 'FREE';
                return (
                  <button key={s.time} onClick={() => !disabled && setSelectedTime(s.time)} disabled={disabled}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      disabled
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                        : selectedTime === s.time
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                    }`}>
                    {s.time}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center flex">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !selectedTime} className="btn-primary flex-1 justify-center flex items-center disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
