'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth';
import { SavedCard } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { ChevronLeft, CreditCard, Trash2, Plus, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SavedCardsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    usersApi.getSavedCards()
      .then((res) => setCards(res.data.data || res.data || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { router.push('/login?next=/profile/cards'); return; }
    load();
  }, [user]);

  const handleAddCard = async () => {
    setAddingCard(true);
    try {
      // Step 1: open a ₹1 auth order — this rides Razorpay's
      // tokenize-during-payment flow since there's no standalone
      // "tokenize only" API. The ₹1 is refunded server-side after verify.
      const orderRes = await usersApi.createSaveCardOrder();
      const order = orderRes.data.data || orderRes.data;
      await openRazorpayCheckout({
        order,
        name: 'HomeServe',
        description: 'Save card for faster checkout (₹1 auth, refunded)',
        prefill: { name: user?.name, contact: user?.phone },
        onSuccess: async (resp) => {
          try {
            // Step 2: verify the signature/payment and persist the token.
            await usersApi.verifySaveCard({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success('Card saved');
            load();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Could not verify card');
          } finally {
            setAddingCard(false);
          }
        },
        onDismiss: () => setAddingCard(false),
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Could not start card verification');
      setAddingCard(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await usersApi.deleteSavedCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success('Card removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove card');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/profile')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to profile
      </button>

      <div className="flex items-start justify-between mb-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Saved cards</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">Save a card for faster checkout next time. We verify with a ₹1 hold that's refunded immediately.</p>

      <button
        onClick={handleAddCard}
        disabled={addingCard}
        className="btn-primary w-full justify-center flex items-center gap-2 mb-6 disabled:opacity-60"
      >
        {addingCard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {addingCard ? 'Verifying card…' : 'Add a new card'}
      </button>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No saved cards"
          description="Cards you save will appear here for faster payment next time."
        />
      ) : (
        <div className="space-y-3">
          {cards.map((c) => (
            <div key={c.id} className="card p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-800">
                  {(c.network || 'Card')} •••• {c.last4}
                </p>
                {c.cardholderName && <p className="text-xs text-slate-500 truncate">{c.cardholderName}</p>}
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="text-slate-300 hover:text-red-500 flex-shrink-0 disabled:opacity-50"
              >
                {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 mt-6 text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
        <p>Card details are tokenized and stored securely by our payment partner — we never see or store your full card number.</p>
      </div>
    </div>
  );
}
