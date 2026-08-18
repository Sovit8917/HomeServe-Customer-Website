'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { disputesApi } from '@/lib/api';
import { DisputeReason } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Wrench, UserX, IndianRupee, Copy, AlertTriangle, PackageX, Receipt, Clock, MoreHorizontal } from 'lucide-react';

const REASONS: { value: DisputeReason; label: string; icon: any }[] = [
  { value: 'SERVICE_NOT_AS_DESCRIBED', label: 'Service not as described', icon: Wrench },
  { value: 'WORKER_NO_SHOW', label: 'Professional no-show', icon: UserX },
  { value: 'OVERCHARGED', label: 'Overcharged', icon: IndianRupee },
  { value: 'DUPLICATE_CHARGE', label: 'Duplicate charge', icon: Copy },
  { value: 'UNAUTHORIZED_CHARGE', label: 'Unauthorized charge', icon: AlertTriangle },
  { value: 'DAMAGE_OR_LOSS', label: 'Damage or loss', icon: PackageX },
  { value: 'EXTRA_CHARGE_UNJUSTIFIED', label: 'Extra charge unjustified', icon: Receipt },
  { value: 'REFUND_NOT_RECEIVED', label: 'Refund not received', icon: Clock },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal },
];

function NewDisputeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId') || '';
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState('');
  const [amountClaimed, setAmountClaimed] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!bookingId) {
      toast.error('Missing booking reference');
      return;
    }
    if (!reason) {
      toast.error('Please choose what this dispute is about');
      return;
    }
    if (description.trim().length < 10) {
      toast.error('Please describe what happened (at least 10 characters)');
      return;
    }
    setSubmitting(true);
    try {
      await disputesApi.raise({
        bookingId,
        reason,
        description: description.trim(),
        amountClaimed: amountClaimed ? Number(amountClaimed) : undefined,
      });
      toast.success('Dispute submitted — our team will review it');
      router.replace('/disputes');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not submit your dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Raise a dispute</h1>
      <p className="text-slate-500 text-sm mb-6">Tell us what happened and our team will review it.</p>

      <div className="card p-5 sm:p-6 space-y-5">
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">What&apos;s this about?</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => {
              const Icon = r.icon;
              const active = reason === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Describe what happened</p>
          <textarea
            className="input-field min-h-[130px] resize-none"
            placeholder="Tell us the details — what went wrong, when, and what resolution you're looking for."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-800 mb-2">Amount in question (optional)</p>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
            <input
              type="number"
              className="input-field pl-8"
              placeholder="0"
              value={amountClaimed}
              onChange={(e) => setAmountClaimed(e.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Our team reviews every dispute — you&apos;ll be notified once it&apos;s under review or resolved. You can withdraw it anytime before that happens.
        </p>

        <button onClick={submit} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit dispute
        </button>
      </div>
    </div>
  );
}

export default function NewDisputePage() {
  return (
    <Suspense fallback={null}>
      <NewDisputeForm />
    </Suspense>
  );
}
