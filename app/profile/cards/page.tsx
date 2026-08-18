'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { SavedCard } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { ChevronLeft, CreditCard, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SavedCardsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login?next=/profile/cards'); return; }
    usersApi.getSavedCards()
      .then((res) => setCards(res.data.data || res.data || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await usersApi.deleteSavedCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success('Card removed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove card');
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/profile')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back to profile
      </button>

      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Saved cards</h1>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No saved cards"
          description="Cards you choose to save during checkout will appear here for faster payment next time."
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
              <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-500 flex-shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
