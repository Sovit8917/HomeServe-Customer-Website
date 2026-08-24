'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { Payment, RefundEntry, FailedPayment } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { CreditCard, ChevronLeft, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function PaymentsHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'payments' | 'refunds' | 'failed'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<RefundEntry[]>([]);
  const [failed, setFailed] = useState<FailedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [refundPage, setRefundPage] = useState(1);
  const [refundHasMore, setRefundHasMore] = useState(false);
  const [loadingMoreRefunds, setLoadingMoreRefunds] = useState(false);
  const REFUND_PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    if (tab === 'payments') {
      paymentsApi.getPaymentHistory(1, 50)
        .then((res) => {
          const data = res.data.data || res.data || {};
          setPayments(data.payments || (Array.isArray(data) ? data : []));
        })
        .finally(() => setLoading(false));
    } else if (tab === 'refunds') {
      setRefundPage(1);
      paymentsApi.getRefundHistory(1, REFUND_PAGE_SIZE)
        .then((res) => {
          const data = res.data.data || res.data || {};
          const list = data.refunds || (Array.isArray(data) ? data : []);
          setRefunds(list);
          setRefundHasMore(typeof data.total === 'number' ? list.length < data.total : list.length === REFUND_PAGE_SIZE);
        })
        .finally(() => setLoading(false));
    } else {
      paymentsApi.getFailedPayments(1, 50)
        .then((res) => {
          const data = res.data.data || res.data || {};
          setFailed(data.payments || (Array.isArray(data) ? data : []));
        })
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const handleRetry = async (fp: FailedPayment) => {
    setRetryingId(fp.paymentId);
    try {
      const orderRes = await paymentsApi.createOrder(fp.bookingId);
      const order = orderRes.data.data || orderRes.data;
      await openRazorpayCheckout({
        order,
        name: 'HomeServe',
        description: fp.bookingNumber,
        prefill: { name: user?.name, contact: user?.phone },
        onSuccess: async (resp) => {
          try {
            await paymentsApi.verify({
              bookingId: fp.bookingId,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              method: fp.method,
            });
            toast.success('Payment successful! Booking confirmed.');
            router.push(`/bookings/${fp.bookingId}?success=true`);
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setRetryingId(null);
          }
        },
        onDismiss: () => {
          setRetryingId(null);
        },
      });
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || 'Could not start payment');
      setRetryingId(null);
    }
  };

  const handleLoadMoreRefunds = () => {
    const nextPage = refundPage + 1;
    setLoadingMoreRefunds(true);
    paymentsApi.getRefundHistory(nextPage, REFUND_PAGE_SIZE)
      .then((res) => {
        const data = res.data.data || res.data || {};
        const list = data.refunds || (Array.isArray(data) ? data : []);
        setRefunds((prev) => [...prev, ...list]);
        setRefundPage(nextPage);
        setRefundHasMore(typeof data.total === 'number' ? refunds.length + list.length < data.total : list.length === REFUND_PAGE_SIZE);
      })
      .finally(() => setLoadingMoreRefunds(false));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/profile')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Profile
      </button>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Payments &amp; refunds</h1>
      <p className="text-slate-500 text-sm mb-6">A full ledger of everything you've paid and been refunded.</p>

      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(['payments', 'refunds', 'failed'] as const).map((t) => (
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
      ) : tab === 'refunds' ? (
        refunds.length === 0 ? (
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
                  {r.status === 'FAILED' && (
                    <p className="text-xs text-red-500 mt-0.5">Refund failed — please contact support for help.</p>
                  )}
                  {r.status === 'PROCESSING' && (
                    <p className="text-xs text-blue-500 mt-0.5">On its way — this can take a few business days.</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                  <p className="font-display font-bold text-emerald-600">+₹{Number(r.amount).toFixed(0)}</p>
                  <Badge status={r.status} />
                </div>
              </div>
            ))}
            {refundHasMore && (
              <button
                onClick={handleLoadMoreRefunds}
                disabled={loadingMoreRefunds}
                className="btn-secondary w-full justify-center flex items-center gap-1.5 mt-2"
              >
                {loadingMoreRefunds ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
              </button>
            )}
          </div>
        )
      ) : failed.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No failed payments" description="Payments that didn't go through, and still have a booking waiting to be paid for, show up here." />
      ) : (
        <div className="space-y-2">
          {failed.map((fp) => (
            <div key={fp.paymentId} className="card p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{fp.bookingNumber}</p>
                <p className="text-xs text-slate-500">
                  {fp.method} · {format(parseISO(fp.failedAt), 'MMM d, yyyy')}
                </p>
                {!fp.canRetry && (
                  <p className="text-xs text-slate-400 mt-0.5">This booking is no longer awaiting payment.</p>
                )}
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                <p className="font-display font-bold text-slate-800">₹{Number(fp.amount).toFixed(0)}</p>
                {fp.canRetry && (
                  <button
                    onClick={() => handleRetry(fp)}
                    disabled={retryingId === fp.paymentId}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {retryingId === fp.paymentId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Retry payment'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
