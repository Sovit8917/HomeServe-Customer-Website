'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoriesApi, servicesApi } from '@/lib/api';
import { Category, Service } from '@/types';
import CategoryGrid from '@/components/home/CategoryGrid';
import ServiceCard from '@/components/services/ServiceCard';
import Spinner from '@/components/ui/Spinner';
import { ShieldCheck, Clock4, BadgePercent, ArrowRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [catRes, svcRes] = await Promise.all([
          categoriesApi.getAll(),
          servicesApi.getAll(),
        ]);
        setCategories(catRes.data.data || catRes.data || []);
        setServices((svcRes.data.data || svcRes.data || []).slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-5 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified & background-checked professionals
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
              Home services,<br/>done right.
            </h1>
            <p className="text-brand-50 text-base sm:text-lg mb-8 max-w-lg">
              Cleaning, repairs, and more — booked in minutes, handled by trusted experts near you.
            </p>
            <form onSubmit={handleSearch} className="flex bg-white rounded-2xl shadow-xl p-1.5 max-w-md">
              <div className="flex items-center pl-3 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need help with?"
                className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
              <button type="submit" className="btn-primary text-sm py-2.5 px-5 whitespace-nowrap">Search</button>
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust strip */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 -mt-10 mb-12 relative z-10">
          {[
            { icon: ShieldCheck, label: 'Verified pros', sub: 'Background checked' },
            { icon: Clock4, label: 'On-time', sub: 'Avg. 30 min arrival' },
            { icon: BadgePercent, label: 'Fair pricing', sub: 'No hidden fees' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-500 hidden sm:block">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Categories */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Browse by category</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <CategoryGrid categories={categories} />
          )}
        </section>

        {/* Popular services */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Popular services</h2>
            <Link href="/services" className="text-sm font-medium text-brand-600 flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : services.length === 0 ? (
            <p className="text-slate-500 text-sm">No services available right now.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {services.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          )}
        </section>

        {/* CTA banner */}
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-10 sm:px-12 sm:py-14 text-center">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Need it done today?</h3>
            <p className="text-accent-50 mb-6 max-w-md mx-auto">Emergency service available for urgent repairs — a professional dispatched within the hour.</p>
            <Link href="/services" className="inline-flex items-center gap-2 bg-white text-accent-600 font-semibold rounded-xl px-6 py-3 hover:bg-accent-50 transition-colors">
              Book emergency service <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
