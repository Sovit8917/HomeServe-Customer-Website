'use client';
import { Worker } from '@/types';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import { Briefcase, MapPin, CheckCircle2 } from 'lucide-react';

export default function WorkerCard({ worker, selected, onSelect, price }: {
  worker: Worker; selected?: boolean; onSelect?: () => void; price?: number;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left card p-4 flex items-center gap-3.5 transition-all duration-150 ${selected ? 'border-brand-400 ring-2 ring-brand-100' : 'hover:border-brand-200 hover:shadow-card-hover'}`}>
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
      {price !== undefined && (
        <div className="text-right flex-shrink-0">
          <p className="font-display font-bold text-brand-600">₹{price}</p>
          {selected && <span className="text-xs text-brand-500 font-medium">Selected</span>}
        </div>
      )}
    </button>
  );
}
