'use client';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { bookingsApi, paymentsApi } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { repeatBooking } from '@/lib/repeatBooking';
import { useAuthStore } from '@/store/auth';

const LiveTrackingMap = dynamic(() => import('@/components/booking/LiveTrackingMap'), { ssr: false });
import { Booking, CancellationPreview, ExtraChargeRequest, ExtraTimeRequest } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import ReviewModal from '@/components/booking/ReviewModal';
import RescheduleModal from '@/components/booking/RescheduleModal';
import SosModal from '@/components/booking/SosModal';
import {
  ChevronLeft, CheckCircle2, MapPin, Calendar, FileText, CreditCard,
  Phone, MessageCircle, XCircle, Star, X, Receipt, ShieldAlert,
  CalendarClock, Clock, IndianRupee, Loader2, Image as ImageIcon, RotateCcw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const STEPS: { status: string; label: string }[] = [
  { status: 'PENDING', label: 'Requested' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'COMPLETED', label: 'Completed' },
];

function BookingDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const showSuccess = searchParams.get('success') === 'true';
  // Set when arriving from a notification about a specific extra-charge /
  // extra-time request — scrolls to and briefly highlights that card below.
  const highlightRequestId = searchParams.get('requestId');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelPreview, setCancelPreview] = useState<CancellationPreview | null>(null);
  const [loadingCancelPreview, setLoadingCancelPreview] = useState(false);
  const [respondingRescheduleAt, setRespondingReschedule] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = () => {
    bookingsApi.getOne(id).then((res) => setBooking(res.data.data || res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  // Deep-linked from a notification about a specific request — jump to it.
  useEffect(() => {
    if (!highlightRequestId || !booking) return;
    const el = document.getElementById(`request-${highlightRequestId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightRequestId, booking]);

  const handleBookAgain = () => {
    if (!booking) return;
    const href = repeatBooking(booking);
    if (href) router.push(href);
  };

  const openCancelModal = () => {
    setShowCancelModal(true);
    setLoadingCancelPreview(true);
    paymentsApi.previewCancellation(id).then((res) => {
      setCancelPreview(res.data.data || res.data);
    }).catch(() => setCancelPreview(null)).finally(() => setLoadingCancelPreview(false));
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please tell us why');
    setCancelling(true);
    try {
      await bookingsApi.cancel(id, cancelReason);
      toast.success('Booking cancelled');
      setShowCancelModal(false);
      setCancelPreview(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handleRespondReschedule = async (accept: boolean) => {
    setRespondingReschedule(true);
    try {
      await bookingsApi.respondToReschedule(id, accept);
      toast.success(accept ? 'Reschedule accepted' : 'Reschedule declined');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingReschedule(false);
    }
  };

  const handleRespondExtraCharge = async (requestId: string, approve: boolean) => {
    setRespondingId(requestId);
    try {
      await bookingsApi.respondToExtraCharge(requestId, approve);
      toast.success(approve ? 'Extra charge approved' : 'Extra charge rejected');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  const handleRespondExtraTime = async (requestId: string, approve: boolean) => {
    setRespondingId(requestId);
    try {
      await bookingsApi.respondToExtraTime(requestId, approve);
      toast.success(approve ? 'Extra time approved' : 'Extra time rejected');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  const handlePayExtraCharge = async (req: ExtraChargeRequest) => {
    setPayingId(req.id);
    try {
      const orderRes = await paymentsApi.createExtraChargeOrder(req.id);
      const order = orderRes.data.data || orderRes.data;
      await openRazorpayCheckout({
        order,
        name: 'HomeServe',
        description: req.label,
        prefill: { name: user?.name, contact: user?.phone },
        onSuccess: async (resp) => {
          try {
            await paymentsApi.verifyExtraChargePayment({
              extraChargeRequestId: req.id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success('Extra charge paid');
            load();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setPayingId(null);
          }
        },
        onDismiss: () => setPayingId(null),
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start payment');
      setPayingId(null);
    }
  };

  const handlePayExtraTime = async (req: ExtraTimeRequest) => {
    setPayingId(req.id);
    try {
      const orderRes = await paymentsApi.createExtraTimeOrder(req.id);
      const order = orderRes.data.data || orderRes.data;
      await openRazorpayCheckout({
        order,
        name: 'HomeServe',
        description: `Extra time (${req.chargeableMinutes} min)`,
        prefill: { name: user?.name, contact: user?.phone },
        onSuccess: async (resp) => {
          try {
            await paymentsApi.verifyExtraTimePayment({
              extraTimeRequestId: req.id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success('Extra time paid');
            load();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          } finally {
            setPayingId(null);
          }
        },
        onDismiss: () => setPayingId(null),
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not start payment');
      setPayingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!booking) return null;

  const currentStepIdx = STEPS.findIndex((s) => s.status === booking.status);
  const isCancellable = ['PENDING', 'ACCEPTED'].includes(booking.status);
  const isReschedulable = ['PENDING', 'ACCEPTED'].includes(booking.status);
  const isCancelledOrRejected = ['CANCELLED', 'REJECTED'].includes(booking.status);
  const isSosEligible = ['ACCEPTED', 'IN_PROGRESS'].includes(booking.status);
  const pendingExtraCharges = (booking.extraCharges || []).filter((r) => r.status === 'PENDING');
  const decidedExtraCharges = (booking.extraCharges || []).filter((r) => r.status !== 'PENDING');
  const pendingExtraTime = (booking.extraTimeRequests || []).filter((r) => r.status === 'PENDING');
  const decidedExtraTime = (booking.extraTimeRequests || []).filter((r) => r.status !== 'PENDING');
  const hasProofPhotos = (booking.proofBeforePhotos?.length || 0) > 0 || (booking.proofAfterPhotos?.length || 0) > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-10">
      <button onClick={() => router.push('/bookings')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> My bookings
      </button>

      {showSuccess && (
        <div className="card p-5 mb-6 bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Booking confirmed!</p>
            <p className="text-xs text-emerald-600">We'll notify you once a professional accepts your request.</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-1">{booking.items?.[0]?.service?.name || 'Service'}</h1>
          <p className="text-xs text-slate-400">Booking ID: {booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <Badge status={booking.status} />
      </div>

      {/* Status timeline */}
      {!isCancelledOrRejected && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-100" />
            <div className="absolute top-3 left-0 h-0.5 bg-brand-500 transition-all duration-500"
              style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }} />
            {STEPS.map((s, i) => (
              <div key={s.status} className="relative flex flex-col items-center gap-2 z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStepIdx ? 'bg-brand-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                  {i <= currentStepIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${i <= currentStepIdx ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelledOrRejected && booking.cancellationReason && (
        <div className="card p-5 mb-4 bg-red-50 border-red-200">
          <p className="text-sm font-medium text-red-800 mb-1">Booking {booking.status.toLowerCase()}</p>
          <p className="text-xs text-red-600">{booking.cancellationReason}</p>
        </div>
      )}

      {/* Worker-proposed reschedule */}
      {booking.pendingRescheduleDate && booking.pendingRescheduleTime && (
        <div className="card p-5 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3 mb-3">
            <CalendarClock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Your professional requested a new time</p>
              <p className="text-xs text-blue-700 mt-0.5">
                {format(parseISO(booking.pendingRescheduleDate), 'EEEE, MMMM d, yyyy')} at {booking.pendingRescheduleTime}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleRespondReschedule(false)} disabled={respondingRescheduleAt}
              className="btn-secondary flex-1 justify-center flex items-center text-red-600 border-red-200 hover:bg-red-50">
              Decline
            </button>
            <button onClick={() => handleRespondReschedule(true)} disabled={respondingRescheduleAt}
              className="btn-primary flex-1 justify-center flex items-center">
              {respondingRescheduleAt ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept'}
            </button>
          </div>
        </div>
      )}

      {/* Worker info */}
      {booking.worker && (
        <div className="card p-5 mb-4 flex items-center gap-3.5">
          <Avatar src={booking.worker.avatar} name={booking.worker.name} size="lg" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{booking.worker.name || 'Service Professional'}</p>
            <StarRating rating={booking.worker.rating} />
          </div>
          <div className="flex gap-2">
            <a
              href={booking.worker.phone ? `tel:${booking.worker.phone}` : undefined}
              aria-disabled={!booking.worker.phone}
              className={`w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 transition-colors ${!booking.worker.phone ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <Phone className="h-4.5 w-4.5" />
            </a>
            <button
              onClick={() => router.push(`/bookings/${booking.id}/chat`)}
              className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 transition-colors"
            >
              <MessageCircle className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live tracking */}
      {['ACCEPTED', 'IN_PROGRESS'].includes(booking.status) && booking.address?.latitude && booking.address?.longitude && (
        <div className="card p-5 mb-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3 text-sm">
            <MapPin className="h-4.5 w-4.5 text-brand-500" /> Live location
          </h2>
          <LiveTrackingMap
            bookingId={booking.id}
            workerName={booking.worker?.name}
            initialWorkerLat={booking.worker?.latitude}
            initialWorkerLng={booking.worker?.longitude}
            destinationLat={booking.address.latitude}
            destinationLng={booking.address.longitude}
          />
        </div>
      )}

      {/* Emergency SOS */}
      {isSosEligible && (
        <button onClick={() => setShowSosModal(true)}
          className="w-full card p-4 mb-4 flex items-center justify-center gap-2 border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-colors">
          <ShieldAlert className="h-4.5 w-4.5" /> Emergency SOS
        </button>
      )}

      {/* Details */}
      <div className="card p-5 mb-4 space-y-4">
        <div className="flex gap-3">
          <Calendar className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">{format(parseISO(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-xs text-slate-500">{booking.scheduledTime}</p>
            {!!booking.rescheduleCount && (
              <p className="text-[11px] text-slate-400 mt-0.5">Rescheduled {booking.rescheduleCount}x</p>
            )}
          </div>
          {isReschedulable && (
            <button onClick={() => setShowRescheduleModal(true)} className="text-xs font-medium text-brand-600 hover:underline flex-shrink-0 self-start">
              Reschedule
            </button>
          )}
        </div>
        {booking.address && (
          <div className="flex gap-3">
            <MapPin className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-800">{booking.address.label}</p>
              <p className="text-xs text-slate-500">{booking.address.fullAddress}, {booking.address.city}, {booking.address.state} {booking.address.pincode}</p>
            </div>
          </div>
        )}
        {booking.notes && (
          <div className="flex gap-3">
            <FileText className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">{booking.notes}</p>
          </div>
        )}
        {booking.payment && (
          <div className="flex gap-3">
            <CreditCard className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800">{booking.payment.method}</p>
              <Badge status={booking.payment.status} />
            </div>
          </div>
        )}
      </div>

      {/* Extra charge requests */}
      {pendingExtraCharges.map((req) => (
        <div key={req.id} id={`request-${req.id}`}
          className={`card p-5 mb-4 bg-amber-50 border-amber-200 ${highlightRequestId === req.id ? 'ring-2 ring-brand-400' : ''}`}>
          <div className="flex items-start gap-3 mb-3">
            <IndianRupee className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Extra charge requested: {req.label}</p>
              <p className="text-xs text-amber-700 mt-0.5">₹{req.amount}{req.reason ? ` — ${req.reason}` : ''}</p>
              {!!req.photos?.length && (
                <div className="flex gap-2 mt-2">
                  {req.photos.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                      <img src={p} alt="Photo evidence" className="w-14 h-14 rounded-lg object-cover border border-amber-200" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleRespondExtraCharge(req.id, false)} disabled={respondingId === req.id}
              className="btn-secondary flex-1 justify-center flex items-center text-red-600 border-red-200 hover:bg-red-50">
              Reject
            </button>
            <button onClick={() => handleRespondExtraCharge(req.id, true)} disabled={respondingId === req.id}
              className="btn-primary flex-1 justify-center flex items-center">
              {respondingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
            </button>
          </div>
        </div>
      ))}
      {decidedExtraCharges.filter((r) => r.status === 'APPROVED' && r.paymentStatus === 'PENDING').map((req) => (
        <div key={req.id} id={`request-${req.id}`}
          className={`card p-5 mb-4 bg-blue-50 border-blue-200 flex items-center justify-between gap-3 ${highlightRequestId === req.id ? 'ring-2 ring-brand-400' : ''}`}>
          <div>
            <p className="text-sm font-semibold text-blue-900">{req.label}</p>
            <p className="text-xs text-blue-700">₹{req.amount} approved — payment pending</p>
          </div>
          <button onClick={() => handlePayExtraCharge(req)} disabled={payingId === req.id} className="btn-primary flex items-center justify-center flex-shrink-0">
            {payingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${req.amount}`}
          </button>
        </div>
      ))}

      {/* Extra time requests */}
      {pendingExtraTime.map((req) => (
        <div key={req.id} id={`request-${req.id}`}
          className={`card p-5 mb-4 bg-amber-50 border-amber-200 ${highlightRequestId === req.id ? 'ring-2 ring-brand-400' : ''}`}>
          <div className="flex items-start gap-3 mb-3">
            <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Extra time requested: {req.requestedMinutes} min</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {req.chargeableMinutes > 0 ? `₹${req.amount} for ${req.chargeableMinutes} chargeable min` : 'Covered by free grace time'}
                {req.reason ? ` — ${req.reason}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleRespondExtraTime(req.id, false)} disabled={respondingId === req.id}
              className="btn-secondary flex-1 justify-center flex items-center text-red-600 border-red-200 hover:bg-red-50">
              Reject
            </button>
            <button onClick={() => handleRespondExtraTime(req.id, true)} disabled={respondingId === req.id}
              className="btn-primary flex-1 justify-center flex items-center">
              {respondingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
            </button>
          </div>
        </div>
      ))}
      {decidedExtraTime.filter((r) => r.status === 'APPROVED' && r.paymentStatus === 'PENDING').map((req) => (
        <div key={req.id} id={`request-${req.id}`}
          className={`card p-5 mb-4 bg-blue-50 border-blue-200 flex items-center justify-between gap-3 ${highlightRequestId === req.id ? 'ring-2 ring-brand-400' : ''}`}>
          <div>
            <p className="text-sm font-semibold text-blue-900">Extra time — {req.chargeableMinutes} min</p>
            <p className="text-xs text-blue-700">₹{req.amount} approved — payment pending</p>
          </div>
          <button onClick={() => handlePayExtraTime(req)} disabled={payingId === req.id} className="btn-primary flex items-center justify-center flex-shrink-0">
            {payingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ₹${req.amount}`}
          </button>
        </div>
      ))}

      {/* Completion proof photos */}
      {hasProofPhotos && (
        <div className="card p-5 mb-4">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800 mb-3 text-sm">
            <ImageIcon className="h-4.5 w-4.5 text-brand-500" /> Completion proof
          </h2>
          {!!booking.proofBeforePhotos?.length && (
            <div className="mb-3">
              <p className="text-xs text-slate-500 mb-1.5">Before</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {booking.proofBeforePhotos.map((p, i) => (
                  <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <img src={p} alt="Before" className="w-24 h-24 rounded-lg object-cover border border-slate-100" />
                  </a>
                ))}
              </div>
            </div>
          )}
          {!!booking.proofAfterPhotos?.length && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">After</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {booking.proofAfterPhotos.map((p, i) => (
                  <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                    <img src={p} alt="After" className="w-24 h-24 rounded-lg object-cover border border-slate-100" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price summary */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3 text-sm">Bill summary</h2>
        <div className="space-y-2 text-sm">
          {booking.items?.map((it) => (
            <div key={it.id} className="flex justify-between text-slate-600">
              <span>{it.service.name} x{it.quantity}</span><span>₹{it.price}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
            <span>Total paid</span><span>₹{booking.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isCancellable && (
          <button onClick={openCancelModal} className="btn-secondary flex-1 justify-center flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
            <XCircle className="h-4 w-4" /> Cancel booking
          </button>
        )}
        {booking.status === 'COMPLETED' && (
          <button onClick={() => setShowReviewModal(true)} className="btn-primary flex-1 justify-center flex items-center gap-1.5">
            <Star className="h-4 w-4" /> Rate this service
          </button>
        )}
        {['COMPLETED', 'CANCELLED'].includes(booking.status) && !!booking.items?.[0]?.service && (
          <button onClick={handleBookAgain} className="btn-secondary flex-1 justify-center flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" /> Book again
          </button>
        )}
      </div>

      {booking.status === 'COMPLETED' && (
        <div className="flex flex-wrap gap-3 mt-3">
          <button
            onClick={() => router.push(`/invoices?bookingId=${booking.id}`)}
            className="btn-secondary flex-1 justify-center flex items-center gap-1.5"
          >
            <Receipt className="h-4 w-4" /> View invoice
          </button>
          <button
            onClick={() => router.push(`/disputes/new?bookingId=${booking.id}`)}
            className="btn-secondary flex-1 justify-center flex items-center gap-1.5 text-amber-700 border-amber-200 hover:bg-amber-50"
          >
            <ShieldAlert className="h-4 w-4" /> Raise a dispute
          </button>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">Cancel booking</h2>
              <button onClick={() => setShowCancelModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="p-5">
              {loadingCancelPreview ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : cancelPreview && (
                <div className={`rounded-xl p-3.5 mb-4 text-xs ${(cancelPreview.feeAmount || 0) > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                  {cancelPreview.isPaid ? (
                    <>
                      <p className="font-medium mb-1">{cancelPreview.note}</p>
                      {(cancelPreview.feeAmount || 0) > 0 && (
                        <p>Paid: ₹{cancelPreview.paidAmount} · Fee: ₹{cancelPreview.feeAmount} ({cancelPreview.feePercent}%) · Refund: ₹{cancelPreview.refundAmount}</p>
                      )}
                    </>
                  ) : (
                    <p>No payment has been made yet, so there's nothing to refund.</p>
                  )}
                </div>
              )}
              <p className="text-sm text-slate-500 mb-3">Please tell us why you're cancelling.</p>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason for cancellation"
                className="input-field resize-none mb-4" rows={3} />
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="btn-secondary flex-1 justify-center flex">Keep booking</button>
                <button onClick={handleCancel} disabled={cancelling} className="flex-1 justify-center flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl px-5 py-2.5 transition-colors disabled:opacity-50">
                  {cancelling ? 'Cancelling...' : 'Confirm cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewModal bookingId={booking.id} workerName={booking.worker?.name} onClose={() => setShowReviewModal(false)} onSubmitted={load} />
      )}

      {showRescheduleModal && (
        <RescheduleModal bookingId={booking.id} workerId={booking.worker?.id} onClose={() => setShowRescheduleModal(false)} onDone={load} />
      )}

      {showSosModal && (
        <SosModal bookingId={booking.id} onClose={() => setShowSosModal(false)} onSent={load} />
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <BookingDetailContent />
    </Suspense>
  );
}
