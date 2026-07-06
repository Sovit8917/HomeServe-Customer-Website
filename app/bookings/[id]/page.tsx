'use client';
import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { bookingsApi } from '@/lib/api';

const LiveTrackingMap = dynamic(() => import('@/components/booking/LiveTrackingMap'), { ssr: false });
import { Booking } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import ReviewModal from '@/components/booking/ReviewModal';
import {
  ChevronLeft, CheckCircle2, MapPin, Calendar, FileText, CreditCard,
  Phone, MessageCircle, XCircle, Star, X,
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
  const showSuccess = searchParams.get('success') === 'true';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    bookingsApi.getOne(id).then((res) => setBooking(res.data.data || res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please tell us why');
    setCancelling(true);
    try {
      await bookingsApi.cancel(id, cancelReason);
      toast.success('Booking cancelled');
      setShowCancelModal(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!booking) return null;

  const currentStepIdx = STEPS.findIndex((s) => s.status === booking.status);
  const isCancellable = ['PENDING', 'ACCEPTED'].includes(booking.status);
  const isCancelledOrRejected = ['CANCELLED', 'REJECTED'].includes(booking.status);

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

      {/* Details */}
      <div className="card p-5 mb-4 space-y-4">
        <div className="flex gap-3">
          <Calendar className="h-4.5 w-4.5 text-brand-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-800">{format(parseISO(booking.scheduledDate), 'EEEE, MMMM d, yyyy')}</p>
            <p className="text-xs text-slate-500">{booking.scheduledTime}</p>
          </div>
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
      <div className="flex gap-3">
        {isCancellable && (
          <button onClick={() => setShowCancelModal(true)} className="btn-secondary flex-1 justify-center flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
            <XCircle className="h-4 w-4" /> Cancel booking
          </button>
        )}
        {booking.status === 'COMPLETED' && (
          <button onClick={() => setShowReviewModal(true)} className="btn-primary flex-1 justify-center flex items-center gap-1.5">
            <Star className="h-4 w-4" /> Rate this service
          </button>
        )}
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">Cancel booking</h2>
              <button onClick={() => setShowCancelModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <div className="p-5">
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
