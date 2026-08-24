'use client';
import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { publicTrackingApi } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import { MapPin, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import logo from '@/assets/logo.png';

const PublicTrackingMap = dynamic(() => import('@/components/booking/PublicTrackingMap'), { ssr: false });

interface PublicTrackingData {
  status: string;
  finished: boolean;
  serviceName: string;
  worker: { name: string; avatar?: string; rating?: number } | null;
  location: { latitude: number; longitude: number; updatedAt: string } | null;
  locationStale: boolean;
  city: string | null;
}

// How often to re-poll the public endpoint for a fresh worker position.
// No socket here (this page has no JWT to open one with), so this is the
// only source of "live" updates.
const POLL_INTERVAL_MS = 15_000;

export default function PublicTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    publicTrackingApi.get(token)
      .then((res) => setData(res.data.data || res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Keep polling while the job is still live — stop once it's finished,
  // there's nothing left to refresh.
  useEffect(() => {
    if (!data || data.finished) return;
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [data, load]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs border border-slate-100 flex items-center justify-center mb-3 bg-white">
            <img src={logo.src} alt="HomeServe" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-900">Live booking tracker</h1>
        </div>

        <div className="card p-6">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : notFound || !data ? (
            <div className="text-center py-6">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800 mb-1">Link invalid or expired</p>
              <p className="text-sm text-slate-500">This tracking link isn't valid anymore. Ask for a fresh one.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Service</p>
                  <p className="font-semibold text-slate-900">{data.serviceName}</p>
                </div>
                <Badge status={data.status} />
              </div>

              {data.worker && (
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100">
                  <Avatar src={data.worker.avatar} name={data.worker.name} size="md" />
                  <div>
                    <p className="font-semibold text-slate-900">{data.worker.name}</p>
                    {typeof data.worker.rating === 'number' && data.worker.rating > 0 && (
                      <StarRating rating={data.worker.rating} />
                    )}
                  </div>
                </div>
              )}

              {data.finished ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-800 mb-1">
                    {data.status === 'CANCELLED' ? 'This booking was cancelled' : 'This job is complete'}
                  </p>
                  <p className="text-sm text-slate-500">There's no live trip to follow anymore.</p>
                </div>
              ) : data.location ? (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-3">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    {data.worker?.name || 'Professional'} is on the way{data.city ? ` · ${data.city}` : ''}
                  </div>
                  <PublicTrackingMap
                    latitude={data.location.latitude}
                    longitude={data.location.longitude}
                    workerName={data.worker?.name}
                  />
                  <p className="text-center text-xs text-slate-400 mt-2">Updates automatically every 15 seconds</p>
                </>
              ) : (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="font-semibold text-slate-700 mb-1">
                    {data.locationStale ? "We've lost the professional's signal" : 'Waiting for live location'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {data.locationStale
                      ? "We haven't heard from their device in a while — this will update as soon as we do."
                      : "This will update automatically once the professional's location comes through."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Shared via HomeServe · No account needed to view this page</p>
      </div>
    </div>
  );
}
