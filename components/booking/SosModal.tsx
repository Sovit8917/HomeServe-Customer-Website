'use client';
import { useState } from 'react';
import { X, Loader2, ShieldAlert } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SosModal({ bookingId, onClose, onSent }: {
  bookingId: string; onClose: () => void; onSent: () => void;
}) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const body: { latitude?: number; longitude?: number; message?: string } = { message: message || undefined };
      // Best-effort location — never block the alert on it.
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { body.latitude = pos.coords.latitude; body.longitude = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 3000 },
          );
        });
      }
      await bookingsApi.raiseSos(bookingId, body);
      toast.success('SOS alert sent — our team has been notified');
      onSent();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send SOS alert');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-red-100">
          <h2 className="font-display font-bold text-lg text-red-700 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" /> Emergency SOS
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-3">
            This will immediately alert our support team with your location. Only use this in a genuine emergency.
          </p>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's happening? (optional)"
            className="input-field resize-none mb-4" rows={3} />
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center flex">Cancel</button>
            <button onClick={handleSend} disabled={sending}
              className="flex-1 justify-center flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send SOS alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
