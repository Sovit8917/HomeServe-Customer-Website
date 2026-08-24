'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { usersApi, cartApi, paymentsApi } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { Address, Cart } from '@/types';
import toast from 'react-hot-toast';
import { format, addDays, isToday } from 'date-fns';
import {
  Calendar, MapPin, FileText, CreditCard, Plus, Check, ChevronLeft,
  Smartphone, Wallet, Banknote, Loader2,
} from 'lucide-react';
import AddressFormModal from '@/components/booking/AddressFormModal';
import ServiceInclusionsExclusions from '@/components/services/ServiceInclusionsExclusions';
import Spinner from '@/components/ui/Spinner';

const TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function CartCheckoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const refreshCartBadge = useCartStore((s) => s.refresh);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'WALLET' | 'CASH'>('UPI');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([cartApi.get(), usersApi.getAddresses()])
      .then(([cartRes, addrRes]) => {
        const cartData = cartRes.data.data || cartRes.data;
        setCart(cartData);
        if (!cartData?.items?.length) {
          toast.error('Your cart is empty');
          router.push('/cart');
          return;
        }
        const addrs = addrRes.data.data || addrRes.data || [];
        setAddresses(addrs);
        const def = addrs.find((a: Address) => a.isDefault) || addrs[0];
        if (def) setSelectedAddressId(def.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const handleCheckout = async () => {
    if (!selectedAddressId) return toast.error('Please select an address');
    if (!selectedTime) return toast.error('Please select a time slot');
    setSubmitting(true);
    try {
      const res = await cartApi.checkout({
        addressId: selectedAddressId,
        scheduledDate: dateStr,
        scheduledTime: selectedTime,
        description: notes,
        paymentMethod: paymentMethod === 'WALLET' ? 'WALLET' : 'CASH',
      });
      const booking = res.data.data || res.data;
      refreshCartBadge();

      // WALLET already paid in one shot on the backend.
      if (paymentMethod === 'WALLET') {
        toast.success('Paid from wallet. Booking confirmed!');
        router.push(`/bookings/${booking.id}?success=true`);
        return;
      }

      if (paymentMethod === 'CASH') {
        await paymentsApi.payCash(booking.id).catch(() => {});
        toast.success('Booking confirmed! Pay cash on completion.');
        router.push(`/bookings/${booking.id}?success=true`);
        return;
      }

      // UPI / CARD -> Razorpay
      try {
        const orderRes = await paymentsApi.createOrder(booking.id);
        const order = orderRes.data.data || orderRes.data;
        await openRazorpayCheckout({
          order,
          name: 'HomeServe',
          description: `${cart?.items.length} services`,
          prefill: { name: user?.name, contact: user?.phone },
          onSuccess: async (resp) => {
            try {
              await paymentsApi.verify({
                bookingId: booking.id,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
                method: paymentMethod,
              });
              toast.success('Payment successful! Booking confirmed!');
              router.push(`/bookings/${booking.id}?success=true`);
            } catch (err: any) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
              router.push(`/bookings/${booking.id}`);
            }
          },
          onDismiss: () => {
            toast.error('Payment cancelled. You can pay again from booking details.');
            router.push(`/bookings/${booking.id}`);
          },
        });
      } catch (err: any) {
        toast.error(err.message || err.response?.data?.message || 'Could not start payment');
        router.push(`/bookings/${booking.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to check out');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!cart) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Confirm your booking</h1>
      <p className="text-sm text-slate-500 mb-6">{cart.items.length} service{cart.items.length > 1 ? 's' : ''} from your cart</p>

      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">Services</h2>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{item.service?.name} × {item.quantity}</span>
              <span className="font-medium text-slate-800">₹{item.price}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
          <Calendar className="h-4.5 w-4.5 text-brand-500" /> Date & time
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {next7Days.map((d) => (
            <button key={d.toISOString()} onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 w-16 py-2.5 rounded-xl border text-center transition-colors ${format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'}`}>
              <p className="text-xs opacity-80">{isToday(d) ? 'Today' : format(d, 'EEE')}</p>
              <p className="font-semibold">{format(d, 'd')}</p>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TIME_SLOTS.map((time) => (
            <button key={time} onClick={() => setSelectedTime(time)}
              className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${selectedTime === time ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'}`}>
              {time}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
          <MapPin className="h-4.5 w-4.5 text-brand-500" /> Service address
        </h2>
        <div className="space-y-2 mb-3">
          {addresses.map((a) => (
            <button key={a.id} onClick={() => setSelectedAddressId(a.id)}
              className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${selectedAddressId === a.id ? 'border-brand-400 bg-brand-50/50' : 'border-slate-200 hover:border-brand-200'}`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedAddressId === a.id ? 'border-brand-500 bg-brand-500' : 'border-slate-300'}`}>
                {selectedAddressId === a.id && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-800 text-sm">{a.label}</p>
                <p className="text-xs text-slate-500 truncate">{a.fullAddress}, {a.city}, {a.state} {a.pincode}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddressModal(true)} className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
          <Plus className="h-4 w-4" /> Add new address
        </button>
      </section>

      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
          <FileText className="h-4.5 w-4.5 text-brand-500" /> Additional notes <span className="text-xs font-normal text-slate-400">(optional)</span>
        </h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific instructions for the professional..."
          className="input-field resize-none" rows={3} />
      </section>

      {/* What's Included & What's Not Included */}
      {cart?.items?.[0]?.service && (
        <ServiceInclusionsExclusions service={cart.items[0].service} />
      )}

      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
          <CreditCard className="h-4.5 w-4.5 text-brand-500" /> Payment method
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'UPI', label: 'UPI', icon: Smartphone },
            { id: 'CARD', label: 'Card', icon: CreditCard },
            { id: 'WALLET', label: 'Wallet', icon: Wallet },
            { id: 'CASH', label: 'Cash', icon: Banknote },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPaymentMethod(id as any)}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border transition-colors ${paymentMethod === id ? 'border-brand-400 bg-brand-50/50' : 'border-slate-200 hover:border-brand-200'}`}>
              <Icon className={`h-5 w-5 ${paymentMethod === id ? 'text-brand-500' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${paymentMethod === id ? 'text-brand-700' : 'text-slate-600'}`}>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">Price details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
            <span>Total</span><span>₹{cart.subtotal}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Final tax/coupon adjustments apply the same way as single-service bookings.</p>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Total amount</p>
            <p className="font-display font-bold text-xl text-slate-900">₹{cart.subtotal}</p>
          </div>
          <button onClick={handleCheckout} disabled={submitting} className="btn-primary flex-1 sm:flex-none sm:px-10 justify-center flex items-center py-3">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm booking'}
          </button>
        </div>
      </div>

      {showAddressModal && (
        <AddressFormModal
          onClose={() => setShowAddressModal(false)}
          onSaved={(a) => { setAddresses((prev) => [...prev, a]); setSelectedAddressId(a.id); }}
        />
      )}
    </div>
  );
}
