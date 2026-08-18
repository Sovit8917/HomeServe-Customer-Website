'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { servicesApi, workersApi, usersApi } from '@/lib/api';
import { useBookingStore } from '@/store/booking';
import { useAuthStore } from '@/store/auth';
import { Service, Worker, ServiceReview } from '@/types';
import Spinner from '@/components/ui/Spinner';
import WorkerCard from '@/components/services/WorkerCard';
import EmptyState from '@/components/ui/EmptyState';
import StarRating from '@/components/ui/StarRating';
import Avatar from '@/components/ui/Avatar';
import { Clock, ShieldCheck, ChevronLeft, Users, Sparkles, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

export default function ServiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [reviewStats, setReviewStats] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const setDraft = useBookingStore((s) => s.setDraft);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    servicesApi.getOne(id)
      .then((res) => setService(res.data.data || res.data))
      .finally(() => setLoading(false));

    servicesApi.getReviews(id).then((res) => {
      const payload = res.data.data || res.data || {};
      setReviews(payload.reviews || []);
      setReviewStats({ averageRating: payload.averageRating || 0, totalReviews: payload.totalReviews || 0 });
    }).catch(() => {});
  }, [id]);

  // Log this view so it surfaces in the customer's "Recently viewed" list.
  useEffect(() => {
    if (!id || !user) return;
    servicesApi.trackView(id).catch(() => {});
  }, [id, user]);

  // Nearby professionals require a location; use the customer's default
  // saved address first, and fall back to browser geolocation if needed.
  useEffect(() => {
    if (!id || !user) { setWorkersLoading(false); return; }
    setWorkersLoading(true);

    const fetchNearby = (lat: number, lng: number) => {
      workersApi.getNearby(lat, lng, id)
        .then((res) => setWorkers(res.data.data || res.data || []))
        .catch(() => setWorkers([]))
        .finally(() => setWorkersLoading(false));
    };

    usersApi.getAddresses().then((res) => {
      const addrs = res.data.data || res.data || [];
      const def = addrs.find((a: any) => a.isDefault) || addrs[0];
      if (def?.latitude && def?.longitude) {
        fetchNearby(def.latitude, def.longitude);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
          () => setWorkersLoading(false)
        );
      } else {
        setWorkersLoading(false);
      }
    }).catch(() => setWorkersLoading(false));
  }, [id, user]);

  const handleContinue = () => {
    if (!service) return;
    if (!user) {
      toast('Please sign in to continue', { icon: '🔒' });
      router.push('/login');
      return;
    }
    setDraft({ serviceId: service.id, service, workerId: selectedWorkerId || undefined });
    router.push(`/checkout/${service.id}`);
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!service) return <EmptyState icon={Users} title="Service not found" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="card overflow-hidden mb-6">
        <div className="h-48 sm:h-64 bg-gradient-to-br from-brand-800 to-brand-500 relative">
          {service.image ? (
            <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <span className="text-xs font-bold tracking-wider text-white/80 uppercase">{service.category?.name || 'Service'}</span>
            </div>
          )}
        </div>
        <div className="p-5 sm:p-6">
          {service.category && <span className="badge bg-brand-50 text-brand-600 mb-2">{service.category.name}</span>}
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">{service.name}</h1>
          {service.description && <p className="text-slate-600 mb-4 leading-relaxed">{service.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-slate-600"><Clock className="h-4 w-4 text-brand-500" /> {service.duration} minutes</span>
            <span className="flex items-center gap-1.5 text-slate-600"><ShieldCheck className="h-4 w-4 text-brand-500" /> Verified professionals</span>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Starting price</span>
              <p className="font-display text-2xl font-bold text-brand-600">₹{service.basePrice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service reviews */}
      {reviewStats && reviewStats.totalReviews > 0 && (
        <div className="card p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Customer reviews</h2>
            <div className="flex items-center gap-2">
              <StarRating rating={reviewStats.averageRating} />
              <span className="text-sm font-semibold text-slate-700">{reviewStats.averageRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({reviewStats.totalReviews})</span>
            </div>
          </div>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <Avatar src={r.user?.avatar} name={r.user?.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-800">{r.user?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slate-400 flex-shrink-0">{format(parseISO(r.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <StarRating rating={r.rating} />
                  {r.comment && <p className="text-sm text-slate-600 mt-1.5">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="section-title mb-1">Choose a professional</h2>
        <p className="text-sm text-slate-500 mb-4">Optional — we'll auto-assign the best available pro if you skip this.</p>
        {!user ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            Sign in and add an address to see professionals available near you.
          </div>
        ) : workersLoading ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : workers.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500">
            No professionals nearby right now. We'll assign one automatically when you book.
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map((w) => (
              <WorkerCard
                key={w.id}
                worker={w}
                price={(w as any).price ?? service.basePrice}
                selected={selectedWorkerId === w.id}
                onSelect={() => setSelectedWorkerId(selectedWorkerId === w.id ? null : w.id)}
                serviceName={service.name}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0 sm:static py-4">
        <button onClick={handleContinue} className="btn-primary w-full justify-center flex items-center text-base py-3.5">
          Continue to booking
        </button>
      </div>
    </div>
  );
}
