'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { walletApi } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth';
import { WalletTransaction } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { ChevronLeft, Wallet as WalletIcon, Plus, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [200, 500, 1000, 2000];

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number | ''>('');
  const [toppingUp, setToppingUp] = useState(false);

  const load = () => {
    Promise.all([walletApi.get(), walletApi.getTransactions()])
      .then(([walletRes, txRes]) => {
        const w = walletRes.data.data || walletRes.data;
        setBalance(Number(w?.balance ?? 0));
        const payload = txRes.data.data || txRes.data || {};
        setTransactions(payload.transactions || (Array.isArray(payload) ? payload : []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { router.push('/login?next=/wallet'); return; }
    load();
  }, [user]);

  const handleTopup = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    setToppingUp(true);
    try {
      const orderRes = await walletApi.createTopupOrder(amt);
      const order = orderRes.data.data || orderRes.data;

      await openRazorpayCheckout({
        order: { orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId },
        name: 'HomeServe',
        description: 'Wallet top-up',
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        onSuccess: async (resp) => {
          try {
            await walletApi.verifyTopup({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              amount: amt,
            });
            toast.success('Wallet topped up!');
            setAmount('');
            load();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Could not verify payment');
          } finally {
            setToppingUp(false);
          }
        },
        onDismiss: () => setToppingUp(false),
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start top-up');
      setToppingUp(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/profile')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to profile
      </button>

      <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-700 text-white mb-6">
        <div className="flex items-center gap-2 mb-1 text-brand-100">
          <WalletIcon className="h-4 w-4" /> <span className="text-sm">Wallet balance</span>
        </div>
        <p className="font-display text-4xl font-bold">₹{balance ?? 0}</p>
      </div>

      {/* Top-up */}
      <section className="card p-5 sm:p-6 mb-6">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
          <Plus className="h-4.5 w-4.5 text-brand-500" /> Add money
        </h2>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${amount === a ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-200 text-slate-700 hover:border-brand-300'}`}
            >
              ₹{a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            placeholder="Enter amount"
            className="input-field flex-1"
          />
          <button onClick={handleTopup} disabled={toppingUp || !amount} className="btn-primary px-6 disabled:opacity-50">
            {toppingUp ? 'Processing...' : 'Add money'}
          </button>
        </div>
      </section>

      {/* Transactions */}
      <section>
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
          <History className="h-4.5 w-4.5 text-brand-500" /> Transaction history
        </h2>
        {transactions.length === 0 ? (
          <EmptyState icon={History} title="No transactions yet" description="Your wallet activity will show up here." />
        ) : (
          <div className="card divide-y divide-slate-50">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{t.description || (t.type === 'CREDIT' ? 'Wallet credit' : 'Wallet debit')}</p>
                  <p className="text-xs text-slate-400">{format(parseISO(t.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                </div>
                <p className={`font-semibold text-sm flex-shrink-0 ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'CREDIT' ? '+' : '−'}₹{t.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
