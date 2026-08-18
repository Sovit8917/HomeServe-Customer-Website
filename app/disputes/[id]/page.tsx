'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { disputesApi } from '@/lib/api';
import { Dispute, DisputeStatus } from '@/types';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_META: Record<DisputeStatus, { cls: string; label: string }> = {
  OPEN: { cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Open' },
  UNDER_REVIEW: { cls: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'Under Review' },
  RESOLVED_REFUNDED: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Refunded' },
  RESOLVED_PARTIAL_REFUND: { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Partial Refund' },
  RESOLVED_UPHELD: { cls: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'Upheld' },
  RESOLVED_NO_ACTION: { cls: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'No Action' },
  WITHDRAWN: { cls: 'bg-slate-100 text-slate-500 border border-slate-200', label: 'Withdrawn' },
};

const REASON_LABEL: Record<string, string> = {
  SERVICE_NOT_AS_DESCRIBED: 'Service not as described',
  WORKER_NO_SHOW: 'Professional no-show',
  OVERCHARGED: 'Overcharged',
  DUPLICATE_CHARGE: 'Duplicate charge',
  UNAUTHORIZED_CHARGE: 'Unauthorized charge',
  DAMAGE_OR_LOSS: 'Damage or loss',
  EXTRA_CHARGE_UNJUSTIFIED: 'Extra charge unjustified',
  REFUND_NOT_RECEIVED: 'Refund not received',
  OTHER: 'Other',
};

export default function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = () => {
    disputesApi.getOne(id)
      .then((res) => setDispute(res.data.data || res.data))
      .catch(() => toast.error('Could not load this dispute'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleWithdraw = async () => {
    if (!confirm('Withdraw this dispute? This cannot be undone.')) return;
    setWithdrawing(true);
    try {
      await disputesApi.withdraw(id);
      toast.success('Dispute withdrawn');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not withdraw dispute');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!dispute) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-slate-500 mb-4">This dispute could not be found.</p>
        <button onClick={() => router.push('/disputes')} className="btn-secondary">Back to disputes</button>
      </div>
    );
  }

  const meta = STATUS_META[dispute.status] || STATUS_META.OPEN;
  const canWithdraw = dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/disputes')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> My disputes
      </button>

      <div className="card p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-5 w-5 text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-display text-lg font-bold text-slate-900">{REASON_LABEL[dispute.reason] || dispute.reason}</h1>
              <span className={`badge ${meta.cls}`}>{meta.label}</span>
            </div>
            <p className="text-xs text-slate-400">Raised {format(parseISO(dispute.createdAt), 'MMM d, yyyy · h:mm a')}</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-1">Description</p>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
          </div>

          {dispute.amountClaimed != null && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Amount in question</p>
              <p className="font-semibold text-slate-800">₹{Number(dispute.amountClaimed).toFixed(0)}</p>
            </div>
          )}

          {dispute.booking?.id && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Booking</p>
              <a href={`/bookings/${dispute.booking.id}`} className="text-brand-600 font-medium hover:underline">
                View booking #{dispute.booking.id.slice(0, 8).toUpperCase()}
              </a>
            </div>
          )}

          {dispute.resolutionNote && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400 mb-1">Resolution note</p>
              <p className="text-slate-700 leading-relaxed">{dispute.resolutionNote}</p>
              {dispute.refundAmount != null && (
                <p className="text-emerald-600 font-semibold mt-2">Refunded ₹{Number(dispute.refundAmount).toFixed(0)}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {canWithdraw && (
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
          Withdraw dispute
        </button>
      )}
    </div>
  );
}
