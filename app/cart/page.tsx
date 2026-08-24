'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { Cart } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { ShoppingCart, Minus, Plus, Trash2, AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const refreshCartBadge = useCartStore((s) => s.refresh);

  const load = () => {
    setLoading(true);
    cartApi.get()
      .then((res) => setCart(res.data.data || res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateQuantity = async (serviceId: string, quantity: number) => {
    setUpdatingId(serviceId);
    try {
      await cartApi.updateItem(serviceId, quantity);
      await Promise.all([load(), refreshCartBadge()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update cart');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (serviceId: string) => {
    setUpdatingId(serviceId);
    try {
      await cartApi.removeItem(serviceId);
      await Promise.all([load(), refreshCartBadge()]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  const items = cart?.items || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Your cart</h1>
      <p className="text-slate-500 text-sm mb-6">Everything you've added, ready to book together.</p>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Add services from any listing to book them all in one go."
          action={<Link href="/services" className="btn-primary">Browse services</Link>}
        />
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className={`card p-4 flex items-center gap-4 ${!item.available ? 'opacity-60' : ''}`}>
                <div className="w-14 h-14 rounded-xl bg-brand-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {item.service?.image ? (
                    <img src={item.service.image} alt={item.service.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="h-5 w-5 text-brand-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-900 truncate">{item.service?.name || 'Service'}</p>
                  {!item.available ? (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="h-3 w-3" /> No longer available — remove to check out
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">₹{item.service?.basePrice} each</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-slate-200 rounded-lg">
                      <button
                        disabled={updatingId === item.serviceId}
                        onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                        className="p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        disabled={updatingId === item.serviceId}
                        onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                        className="p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      disabled={updatingId === item.serviceId}
                      onClick={() => removeItem(item.serviceId)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="font-display font-bold text-slate-800 flex-shrink-0">₹{item.price}</p>
              </div>
            ))}
          </div>

          {cart && cart.unavailableCount > 0 && (
            <div className="card p-4 mb-4 bg-amber-50 border-amber-200 flex items-start gap-2 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {cart.unavailableCount} item{cart.unavailableCount > 1 ? 's are' : ' is'} no longer available. Remove {cart.unavailableCount > 1 ? 'them' : 'it'} before checking out.
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-30">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Subtotal ({cart?.itemCount} item{cart && cart.itemCount !== 1 ? 's' : ''})</p>
                <p className="font-display font-bold text-xl text-slate-900">₹{cart?.subtotal}</p>
              </div>
              <button
                onClick={() => router.push('/cart/checkout')}
                disabled={!cart || cart.unavailableCount > 0 || items.length === 0}
                className="btn-primary flex-1 sm:flex-none sm:px-10 justify-center flex items-center py-3 disabled:opacity-50"
              >
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
