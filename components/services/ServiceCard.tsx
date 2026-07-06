'use client';
import Link from 'next/link';
import { Service } from '@/types';
import { Clock, ArrowRight } from 'lucide-react';

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <Link href={`/services/${service.id}`} className="card group hover:shadow-card-hover transition-all duration-200 flex flex-col">
      <div className="relative h-36 sm:h-40 bg-gradient-to-br from-brand-50 to-brand-100 overflow-hidden">
        {service.image ? (
          <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-300">
            <span className="text-4xl font-display font-bold opacity-30">{service.name.charAt(0)}</span>
          </div>
        )}
        {service.category && (
          <span className="absolute top-2.5 left-2.5 badge bg-white/90 backdrop-blur text-slate-700 shadow-sm">{service.category.name}</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{service.name}</h3>
        {service.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{service.description}</p>}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
          <div>
            <span className="text-xs text-slate-400">Starts at</span>
            <p className="font-display font-bold text-brand-600">₹{service.basePrice}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" /> {service.duration} min
          </div>
        </div>
      </div>
    </Link>
  );
}
