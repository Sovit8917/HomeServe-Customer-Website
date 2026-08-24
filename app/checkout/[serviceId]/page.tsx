'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/booking';
import { useAuthStore } from '@/store/auth';
import { bookingsApi, usersApi, couponsApi, paymentsApi, workersApi, recurringBookingsApi } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { Address, AvailabilitySlot } from '@/types';
import toast from 'react-hot-toast';
import { format, addDays, isToday } from 'date-fns';
import {
  Calendar, MapPin, FileText, CreditCard, Plus, Check, ChevronLeft,
  Smartphone, Wallet, Banknote, Tag, X, Loader2, AlertTriangle, Repeat, Sparkles,
} from 'lucide-react';
import AddressFormModal from '@/components/booking/AddressFormModal';
import ServiceInclusionsExclusions from '@/components/services/ServiceInclusionsExclusions';

// Fallback slot list, used only when no specific worker is selected yet
// (the real per-worker availability heatmap needs a workerId + date).
const FALLBACK_TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function CheckoutPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();
  const { draft, setDraft, clearDraft } = useBookingStore();
  const { user } = useAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'WALLET' | 'CASH'>('UPI');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');

  // Dynamic per-worker slot availability (heatmap: FREE / BOOKED / UNAVAILABLE + decline risk)
  const [slots, setSlots] = useState<AvailabilitySlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Server-side computed price — the source of truth for what's actually charged.
  const [pricePreview, setPricePreview] = useState<{
    totalAmount: number; discountAmount: number; taxAmount: number; finalAmount: number;
    subscriptionUpsell?: {
      planId: string; planName: string; price: number; durationDays: number;
      discountPercent: number; estimatedSavingsThisOrder: number;
    } | null;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!draft.service || draft.service.id !== serviceId) { router.push(`/services/${serviceId}`); return; }
    usersApi.getAddresses().then((res) => {
      const addrs = res.data.data || res.data || [];
      setAddresses(addrs);
      const def = addrs.find((a: Address) => a.isDefault) || addrs[0];
      if (def) setSelectedAddressId(def.id);
    });
  }, [serviceId]);

  if (!draft.service) return null;
  const service = draft.service;

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Load the real per-slot availability whenever a specific worker + date is in play.
  // With no preferred worker chosen, there's no single heatmap to show — fall back to the static list.
  useEffect(() => {
    if (!draft.workerId) { setSlots(null); return; }
    setLoadingSlots(true);
    workersApi.getAvailabilitySlots(draft.workerId, dateStr)
      .then((res) => {
        const data = res.data.data || res.data;
        setSlots(data?.slots || []);
        // If the previously-selected time is no longer free on the new date, clear it.
        setSelectedTime((prev) => {
          const stillFree = (data?.slots || []).find((s: AvailabilitySlot) => s.time === prev && s.status === 'FREE');
          return stillFree ? prev : '';
        });
      })
      .catch(() => setSlots(null))
      .finally(() => setLoadingSlots(false));
  }, [draft.workerId, dateStr]);

  // Re-fetch the server-computed price whenever anything that affects it changes.
  useEffect(() => {
    if (!selectedTime) { setPricePreview(null); return; }
    let cancelled = false;
    setLoadingPreview(true);
    bookingsApi.preview({
      items: [{ serviceId: service.id, quantity: 1 }],
      scheduledDate: dateStr,
      scheduledTime: selectedTime,
      couponId: appliedCouponId || undefined,
    }).then((res) => {
      if (cancelled) return;
      const data = res.data.data || res.data;
      setPricePreview(data);
    }).catch(() => { if (!cancelled) setPricePreview(null); })
      .finally(() => { if (!cancelled) setLoadingPreview(false); });
    return () => { cancelled = true; };
  }, [service.id, dateStr, selectedTime, appliedCouponId]);

  const subtotal = pricePreview?.totalAmount ?? service.basePrice;
  const discount = pricePreview?.discountAmount ?? 0;
  const taxAmount = pricePreview?.taxAmount ?? 0;
  const total = pricePreview?.finalAmount ?? Math.max(subtotal - discount, 0);

  const availableSlots = slots ?? FALLBACK_TIME_SLOTS.map((time) => ({ time, status: 'FREE' as const, declineRisk: 'LOW' as const }));

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await couponsApi.validate(couponCode, subtotal);
      const data = res.data.data || res.data;
      setAppliedCouponId(data.coupon?.id || null);
      toast.success(`Coupon applied! ₹${data.discount} off`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setAppliedCouponId(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedAddressId) return toast.error('Please select an address');
    if (!selectedTime) return toast.error('Please select a time slot');
    setSubmitting(true);

    if (makeRecurring) {
      try {
        await recurringBookingsApi.create({
          items: [{ serviceId: service.id, quantity: 1 }],
          frequency: recurringFrequency,
          startDate: dateStr,
          scheduledTime: selectedTime,
          addressId: selectedAddressId,
          description: notes,
          preferredWorkerId: draft.workerId || undefined,
        });
        clearDraft();
        toast.success('Recurring booking scheduled!');
        router.push('/recurring-bookings');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to schedule recurring booking');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      const res = await bookingsApi.create({
        items: [{ serviceId: service.id, quantity: 1 }],
        addressId: selectedAddressId,
        scheduledDate: dateStr,
        scheduledTime: selectedTime,
        description: notes,
        couponId: appliedCouponId || undefined,
        preferredWorkerId: draft.workerId || undefined,
      });
      const booking = res.data.data || res.data;

      if (paymentMethod === 'CASH') {
        await paymentsApi.payCash(booking.id).catch(() => {});
        clearDraft();
        toast.success('Booking confirmed! Pay cash on completion.');
        router.push(`/bookings/${booking.id}?success=true`);
        return;
      }

      if (paymentMethod === 'WALLET') {
        try {
          await paymentsApi.payFromWallet(booking.id);
          clearDraft();
          toast.success('Paid from wallet. Booking confirmed!');
          router.push(`/bookings/${booking.id}?success=true`);
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Insufficient wallet balance');
        }
        return;
      }

      // UPI / CARD -> Razorpay
      try {
        const orderRes = await paymentsApi.createOrder(booking.id);
        const order = orderRes.data.data || orderRes.data;
        await openRazorpayCheckout({
          order,
          name: 'HomeServe',
          description: service.name,
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
              clearDraft();
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
      toast.error(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Confirm your booking</h1>
      <p className="text-sm text-slate-500 mb-6">{service.name}</p>

      {/* Date & Time */}
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
        {loadingSlots ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-brand-400" /></div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {availableSlots.map((s) => {
              const disabled = s.status !== 'FREE';
              const selected = selectedTime === s.time;
              return (
                <button key={s.time} onClick={() => !disabled && setSelectedTime(s.time)} disabled={disabled}
                  title={s.status === 'BOOKED' ? 'Already booked' : s.status === 'UNAVAILABLE' ? 'Outside working hours' : s.declineRisk !== 'LOW' ? 'This professional often declines this time slot' : undefined}
                  className={`relative py-2 px-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                    disabled
                      ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed line-through'
                      : selected
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}>
                  {s.time}
                  {!disabled && s.declineRisk !== 'LOW' && (
                    <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center ${s.declineRisk === 'HIGH' ? 'bg-red-400' : 'bg-amber-400'}`}>
                      <AlertTriangle className="h-2 w-2 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {draft.workerId && slots && slots.some((s) => s.declineRisk !== 'LOW' && s.status === 'FREE') && (
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> Slots marked with a dot are ones this professional has often declined recently.
          </p>
        )}
      </section>

      {/* Address */}
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

      {/* Notes */}
      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
          <FileText className="h-4.5 w-4.5 text-brand-500" /> Additional notes <span className="text-xs font-normal text-slate-400">(optional)</span>
        </h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific instructions for the professional..."
          className="input-field resize-none" rows={3} />
      </section>

      {/* What's Included & What's Not Included */}
      <ServiceInclusionsExclusions service={service} />

      {/* Coupon */}
      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
          <Tag className="h-4.5 w-4.5 text-brand-500" /> Coupon code
        </h2>
        <div className="flex gap-2">
          <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code"
            className="input-field flex-1" />
          <button onClick={handleApplyCoupon} disabled={applyingCoupon} className="btn-secondary px-4 whitespace-nowrap">
            {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </button>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between mt-2 text-sm text-emerald-600 font-medium">
            <span>Coupon applied</span>
            <button onClick={() => { setCouponCode(''); setAppliedCouponId(null); }} className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
              <X className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        )}
      </section>

      {/* Recurring */}
      <section className="card p-5 mb-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 font-semibold text-slate-800">
            <Repeat className="h-4.5 w-4.5 text-brand-500" /> Make this a recurring booking
          </span>
          <input type="checkbox" checked={makeRecurring} onChange={(e) => setMakeRecurring(e.target.checked)}
            className="h-5 w-5 rounded accent-brand-500" />
        </label>
        {makeRecurring && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2">How often should this repeat, starting from the date selected above?</p>
            <div className="grid grid-cols-3 gap-2">
              {([['WEEKLY', 'Weekly'], ['BIWEEKLY', 'Bi-weekly'], ['MONTHLY', 'Monthly']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setRecurringFrequency(id)}
                  className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${recurringFrequency === id ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">Each occurrence is booked and paid for separately (cash on completion) — you can pause, skip, or cancel any time from Recurring Bookings.</p>
          </div>
        )}
      </section>

      {/* Subscription upsell — server only returns this when the customer
          has no active plan; estimatedSavingsThisOrder is computed against
          this exact order total, so it's always accurate to what's on screen. */}
      {pricePreview?.subscriptionUpsell && (
        <section className="card p-5 mb-4 bg-gradient-to-br from-amber-50 to-brand-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Save ₹{pricePreview.subscriptionUpsell.estimatedSavingsThisOrder.toFixed(0)} on this order with {pricePreview.subscriptionUpsell.planName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {pricePreview.subscriptionUpsell.discountPercent}% off every booking for {pricePreview.subscriptionUpsell.durationDays} days — plan costs ₹{pricePreview.subscriptionUpsell.price}
              </p>
              <a
                href={`/subscription?plan=${pricePreview.subscriptionUpsell.planId}`}
                className="inline-block mt-2 text-xs font-semibold text-brand-600 hover:underline"
              >
                View plan →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Payment method */}
      <section className="card p-5 mb-4">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-4">
          <CreditCard className="h-4.5 w-4.5 text-brand-500" /> Payment method
        </h2>
        {makeRecurring ? (
          <p className="text-sm text-slate-500">Recurring bookings are paid per-occurrence (cash on completion), set from the Recurring Bookings page.</p>
        ) : (
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
        )}
      </section>

      {/* Price summary */}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
          Price details
          {loadingPreview && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-300" />}
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Service charge</span><span>₹{subtotal}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span><span>−₹{discount}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Taxes &amp; fees</span><span>₹{taxAmount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
            <span>Total</span><span>₹{total}</span>
          </div>
        </div>
        {!selectedTime && (
          <p className="text-xs text-slate-400 mt-2">Pick a time slot to see the final price, including tax.</p>
        )}
      </section>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Total amount</p>
            <p className="font-display font-bold text-xl text-slate-900">₹{total}</p>
          </div>
          <button onClick={handleBooking} disabled={submitting} className="btn-primary flex-1 sm:flex-none sm:px-10 justify-center flex items-center py-3">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : makeRecurring ? 'Schedule recurring booking' : 'Confirm booking'}
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
