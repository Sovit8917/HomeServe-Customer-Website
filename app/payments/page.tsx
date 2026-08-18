'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api';
import { Payment, RefundEntry } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { CreditCard, ChevronLeft, RotateCcw } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function PaymentsHistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'payments' | 'refunds'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<RefundEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (tab === 'payments') {
      paymentsApi.getPaymentHistory(1, 50)
        .then((res) => {
          const data = res.data.data || res.data || {};
          setPayments(data.payments || (Array.isArray(data) ? data : []));
        })
        .finally(() => setLoading(false));
    } else {
      paymentsApi.getRefundHistory(1, 50)
        .then((res) => {
          const data = res.data.data || res.data || {};
          setRefunds(data.refunds || (Array.isArray(data) ? data : []));
        })
        .finally(() => setLoading(false));
    }
  }, [tab]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/profile')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Profile
      </button>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Payments &amp; refunds</h1>
      <p className="text-slate-500 text-sm mb-6">A full ledger of everything you've paid and been refunded.</p>

      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(['payments', 'refunds'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tab === 'payments' ? (
        payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet" description="Your payment history will show up here once you make a booking." />
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="card p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {p.booking?.bookingNumber || 'Booking payment'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.method}{p.createdAt ? ` · ${format(parseISO(p.createdAt), 'MMM d, yyyy')}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="font-display font-bold text-slate-800">₹{Number(p.amount).toFixed(0)}</p>
                  <Badge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )
      ) : refunds.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No refunds yet" description="Refunds from cancellations or disputes will show up here." />
      ) : (
        <div className="space-y-2">
          {refunds.map((r) => (
            <div key={r.id} className="card p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">
                  {r.booking?.bookingNumber || 'Booking refund'}
                </p>
                <p className="text-xs text-slate-500">
                  To {r.destination === 'WALLET' ? 'wallet' : 'original payment method'} · {format(parseISO(r.createdAt), 'MMM d, yyyy')}
                </p>
                {r.reason && <p className="text-xs text-slate-400 truncate">{r.reason}</p>}
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                <p className="font-display font-bold text-emerald-600">+₹{Number(r.amount).toFixed(0)}</p>
                <Badge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
