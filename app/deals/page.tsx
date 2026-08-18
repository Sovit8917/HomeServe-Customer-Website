'use client';
import { useEffect, useState } from 'react';
import { servicesApi } from '@/lib/api';
import { Service } from '@/types';
import ServiceCard from '@/components/services/ServiceCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { BadgePercent } from 'lucide-react';

export default function DealsPage() {
  const [deals, setDeals] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    servicesApi.getDeals()
      .then((res) => setDeals(res.data.data || res.data || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center gap-2 mb-1">
        <BadgePercent className="h-6 w-6 text-accent-500" />
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Deals &amp; offers</h1>
      </div>
      <p className="text-slate-500 mb-6">Limited-time discounts on popular services.</p>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : deals.length === 0 ? (
        <EmptyState icon={BadgePercent} title="No deals right now" description="Check back soon — new discounts are added regularly." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {deals.map((s) => <ServiceCard key={s.id} service={s} />)}
        </div>
      )}
    </div>
  );
}
