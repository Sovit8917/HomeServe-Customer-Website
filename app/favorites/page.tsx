'use client';
import { useEffect, useState } from 'react';
import { useFavoritesStore } from '@/store/favorites';
import { servicesApi, workersApi } from '@/lib/api';
import { Service, Worker } from '@/types';
import ServiceCard from '@/components/services/ServiceCard';
import WorkerCard from '@/components/services/WorkerCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Heart, Sparkles, Users } from 'lucide-react';

export default function FavoritesPage() {
  const serviceIds = useFavoritesStore((s) => s.serviceIds);
  const workerIds = useFavoritesStore((s) => s.workerIds);

  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [tab, setTab] = useState<'services' | 'workers'>('services');

  // No "favorites" endpoint on the backend — pull the full catalog and
  // filter down to the ids saved locally. Fine at this catalog size; if it
  // ever grows large this should move server-side.
  useEffect(() => {
    if (serviceIds.length === 0) { setServices([]); setLoadingServices(false); return; }
    setLoadingServices(true);
    servicesApi.getAll()
      .then((res) => {
        const all: Service[] = res.data.data || res.data || [];
        setServices(all.filter((s) => serviceIds.includes(s.id)));
      })
      .finally(() => setLoadingServices(false));
  }, [serviceIds]);

  // No bulk worker lookup either — fetch each favorited worker individually.
  useEffect(() => {
    if (workerIds.length === 0) { setWorkers([]); setLoadingWorkers(false); return; }
    setLoadingWorkers(true);
    Promise.all(
      workerIds.map((id) =>
        workersApi.getOne(id)
          .then((res) => (res.data.data || res.data) as Worker)
          .catch(() => null))
    )
      .then((results) => setWorkers(results.filter((w): w is Worker => !!w)))
      .finally(() => setLoadingWorkers(false));
  }, [workerIds]);

  const loading = tab === 'services' ? loadingServices : loadingWorkers;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Favorites</h1>
        <p className="text-slate-500 text-sm">Services and professionals you've saved.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('services')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'services' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Services {serviceIds.length > 0 && `(${serviceIds.length})`}
        </button>
        <button onClick={() => setTab('workers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'workers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Professionals {workerIds.length > 0 && `(${workerIds.length})`}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tab === 'services' ? (
        services.length === 0 ? (
          <EmptyState icon={Sparkles} title="No favorite services yet"
            description="Tap the heart on any service to save it here." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {services.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        )
      ) : workers.length === 0 ? (
        <EmptyState icon={Users} title="No favorite professionals yet"
          description="Tap the heart on a professional's card to save them here." />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
        </div>
      )}
    </div>
  );
}
