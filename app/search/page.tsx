'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { servicesApi } from '@/lib/api';
import { Service } from '@/types';
import ServiceCard from '@/components/services/ServiceCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Search as SearchIcon, PackageSearch } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlParam = searchParams.get('q') || searchParams.get('search') || '';
  const [query, setQuery] = useState(urlParam);
  const [results, setResults] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(urlParam);
    if (!urlParam.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    servicesApi
      .getAll({ search: urlParam.trim(), q: urlParam.trim() })
      .then((res) => {
        const data = res.data.data || res.data || [];
        // Server-side filter response, fallback client filter if backend returns full catalog
        const filtered = data.filter((s: Service) =>
          !urlParam.trim() ||
          s.name.toLowerCase().includes(urlParam.toLowerCase()) ||
          s.description?.toLowerCase().includes(urlParam.toLowerCase()) ||
          s.category?.name.toLowerCase().includes(urlParam.toLowerCase())
        );
        setResults(filtered);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [urlParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.replace(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <form onSubmit={handleSearch} className="flex bg-white rounded-2xl shadow-card border border-slate-100 p-1.5 max-w-xl mb-8">
        <div className="flex items-center pl-3 text-slate-400"><SearchIcon className="h-5 w-5" /></div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for a service..." autoFocus
          className="flex-1 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent" />
        <button type="submit" className="btn-primary text-sm py-2.5 px-5">Search</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !query.trim() ? (
        <EmptyState icon={SearchIcon} title="Search for services" description="Try 'cleaning', 'plumber', or 'AC repair'." />
      ) : results.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No results found" description={`We couldn't find anything matching "${query}".`} />
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {results.map((s) => <ServiceCard key={s.id} service={s} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
