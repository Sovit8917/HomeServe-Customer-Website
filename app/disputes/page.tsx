'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { disputesApi } from '@/lib/api';
import { Dispute, DisputeStatus } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { ShieldAlert, ChevronRight, Plus } from 'lucide-react';
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

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disputesApi.getMy(1, 50)
      .then((res) => {
        const data = res.data.data || res.data || {};
        setDisputes(data.disputes || (Array.isArray(data) ? data : []));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">My disputes</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">Track issues you've raised on past bookings — our team reviews every case.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="No disputes raised"
          description="If something went wrong with a booking, you can raise a dispute from that booking's details page."
          action={<Link href="/bookings" className="btn-primary">View bookings</Link>}
        />
      ) : (
        <div className="space-y-2">
          {disputes.map((d) => {
            const meta = STATUS_META[d.status] || STATUS_META.OPEN;
            return (
              <Link key={d.id} href={`/disputes/${d.id}`} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="h-5 w-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm text-slate-900 truncate">{REASON_LABEL[d.reason] || d.reason}</p>
                    <span className={`badge ${meta.cls}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{format(parseISO(d.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
