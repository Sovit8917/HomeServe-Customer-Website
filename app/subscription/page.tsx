'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subscriptionsApi } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth';
import { SubscriptionPlan, UserSubscription } from '@/types';
import Spinner from '@/components/ui/Spinner';
import { CheckCircle2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionPlansPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySub, setMySub] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login?next=/subscription');
      return;
    }
    (async () => {
      try {
        const [plansRes, myRes] = await Promise.all([
          subscriptionsApi.getPlans(),
          subscriptionsApi.getMy(),
        ]);
        setPlans(plansRes.data?.data || []);
        setMySub(myRes.data?.data || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const subscribe = async (plan: SubscriptionPlan) => {
    setSubscribingId(plan.id);
    try {
      const orderRes = await subscriptionsApi.createOrder(plan.id);
      const order = orderRes.data.data;

      await openRazorpayCheckout({
        order: { orderId: order.razorpayOrderId, amount: order.amount, currency: order.currency, keyId: order.keyId },
        name: 'HomeServe',
        description: `${plan.name} subscription`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        onSuccess: async (resp) => {
          try {
            await subscriptionsApi.verify({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success(`Subscribed to ${plan.name}!`);
            router.push('/subscription/my');
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Could not verify payment');
          }
        },
        onDismiss: () => setSubscribingId(null),
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start checkout');
      setSubscribingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner /></div>;
  }

  const hasActivePlan = mySub?.status === 'ACTIVE';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-2">Subscription Plans</h1>
        <p className="text-slate-500">Subscribe once, save on every booking.</p>
        {hasActivePlan && (
          <p className="text-sm text-brand-600 font-medium mt-2">
            You're subscribed to {mySub!.plan.name} —{' '}
            <a href="/subscription/my" className="underline">manage it here</a>
          </p>
        )}
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-slate-500">No plans available right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = mySub?.planId === plan.id && hasActivePlan;
            return (
              <div key={plan.id} className="card overflow-hidden flex flex-col">
                <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4" />
                    <span className="font-display font-bold text-lg">{plan.name}</span>
                  </div>
                  {plan.description && <p className="text-brand-50 text-sm">{plan.description}</p>}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                    <span className="text-slate-500 text-sm"> / {plan.durationDays} days</span>
                  </div>
                  <div className="flex items-start gap-2 mb-6 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>
                      {plan.discountPercent}% off every booking
                      {plan.maxDiscountPerBooking ? ` (up to ₹${plan.maxDiscountPerBooking}/booking)` : ''}
                    </span>
                  </div>
                  <div className="mt-auto">
                    {isCurrentPlan ? (
                      <div className="text-center text-sm font-medium text-brand-600 bg-brand-50 rounded-xl py-2.5">
                        Your current plan
                      </div>
                    ) : (
                      <button
                        onClick={() => subscribe(plan)}
                        disabled={hasActivePlan || subscribingId === plan.id}
                        className="btn-primary w-full justify-center disabled:opacity-50"
                      >
                        {subscribingId === plan.id ? 'Processing...' : `Subscribe for ₹${plan.price}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasActivePlan && (
        <p className="text-center text-xs text-slate-400 mt-8">
          You already have an active plan — cancel it from "My Subscription" before switching.
        </p>
      )}
    </div>
  );
}
