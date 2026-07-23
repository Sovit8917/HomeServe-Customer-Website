'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { UserSubscription } from '@/types';
import Spinner from '@/components/ui/Spinner';
import { Star, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MySubscriptionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const res = await subscriptionsApi.getMy();
      setSub(res.data?.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?next=/subscription/my');
      return;
    }
    load();
  }, [user]);

  const daysLeft = (endDate?: string) => {
    if (!endDate) return null;
    return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will lose the discount on future bookings.')) return;
    setCancelling(true);
    try {
      await subscriptionsApi.cancel();
      toast.success('Subscription cancelled');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900 mb-6">My Subscription</h1>

      {!sub ? (
        <div className="card p-8 text-center">
          <Star className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">You don't have an active subscription.</p>
          <a href="/subscription" className="btn-primary inline-flex">Browse Plans</a>
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-lg">{sub.plan.name}</span>
              <span className="text-xs font-semibold bg-white/20 rounded-full px-2.5 py-1">{sub.status}</span>
            </div>
            <p className="text-brand-50 text-sm mb-4">{sub.plan.discountPercent}% off every booking</p>
            {sub.endDate && (
              <div className="flex items-center gap-2 text-xs text-brand-100">
                <Calendar className="h-3.5 w-3.5" />
                {daysLeft(sub.endDate)} day{daysLeft(sub.endDate) === 1 ? '' : 's'} remaining · Expires{' '}
                {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>

          {sub.status === 'ACTIVE' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full border border-red-200 text-red-600 font-medium rounded-xl py-2.5 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
