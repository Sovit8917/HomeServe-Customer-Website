'use client';
import Link from 'next/link';
import { Worker } from '@/types';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import FavoriteButton from '@/components/ui/FavoriteButton';
import { useFavoritesStore } from '@/store/favorites';
import { Briefcase, MapPin, CheckCircle2, MessageCircle } from 'lucide-react';

export default function WorkerCard({ worker, selected, onSelect, price, serviceName }: {
  worker: Worker; selected?: boolean; onSelect?: () => void; price?: number; serviceName?: string;
}) {
  const isFavorite = useFavoritesStore((s) => s.isFavoriteWorker(worker.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavoriteWorker);
  return (
    <div
      className={`w-full card p-4 flex items-center gap-3.5 transition-all duration-150 ${selected ? 'border-brand-400 ring-2 ring-brand-100' : 'hover:border-brand-200 hover:shadow-card-hover'}`}>
      <button onClick={onSelect} className="flex items-center gap-3.5 flex-1 min-w-0 text-left">
        <div className="relative flex-shrink-0">
          <Avatar src={worker.avatar} name={worker.name} size="lg" />
          {worker.isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-slate-900 truncate">{worker.name || 'Service Professional'}</p>
            {worker.totalJobs > 20 && <CheckCircle2 className="h-4 w-4 text-brand-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5 mb-1.5">
            <StarRating rating={worker.rating} />
            <span className="text-xs text-slate-500">{worker.rating.toFixed(1)} ({worker.totalReviews})</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {worker.totalJobs} jobs</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {worker.serviceRadius}km radius</span>
          </div>
        </div>
      </button>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          {price !== undefined && (
            <div className="text-right">
              <p className="font-display font-bold text-brand-600">₹{price}</p>
              {selected && <span className="text-xs text-brand-500 font-medium">Selected</span>}
            </div>
          )}
          <FavoriteButton active={isFavorite} onToggle={() => toggleFavorite(worker.id)} label="professional" size="sm" />
        </div>
        <Link
          href={`/chat/${worker.id}${serviceName ? `?service=${encodeURIComponent(serviceName)}` : ''}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" /> Chat
        </Link>
      </div>
    </div>
  );
}
