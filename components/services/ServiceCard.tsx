'use client';
import Link from 'next/link';
import { Service } from '@/types';
import { Clock, Sparkles, Wrench, Zap, Hammer, PaintBucket, Wind, Bug } from 'lucide-react';
import { useFavoritesStore } from '@/store/favorites';
import FavoriteButton from '@/components/ui/FavoriteButton';

const CATEGORY_ICONS: Record<string, any> = {
  cleaning: Sparkles, plumbing: Wrench, electrician: Zap, electrical: Zap,
  carpentry: Hammer, painting: PaintBucket, ac: Wind, pest: Bug,
};

function getIcon(name?: string) {
  if (!name) return Sparkles;
  const key = Object.keys(CATEGORY_ICONS).find((k) => name.toLowerCase().includes(k));
  return CATEGORY_ICONS[key || ''] || Sparkles;
}

export default function ServiceCard({ service }: { service: Service }) {
  const Icon = getIcon(service.category?.name);
  const isFavorite = useFavoritesStore((s) => s.isFavoriteService(service.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavoriteService);
  return (
    <Link href={`/services/${service.id}`} className="card group hover:shadow-card-hover transition-all duration-200 flex flex-col">
      <div className="relative h-36 sm:h-40 overflow-hidden">
        {service.image ? (
          <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-800 to-brand-500">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-bold tracking-wider text-white/80 uppercase">{service.category?.name || 'Service'}</span>
          </div>
        )}
        {service.category && (
          <span className="absolute top-2.5 left-2.5 badge bg-white/90 backdrop-blur text-slate-700 shadow-sm">{service.category.name}</span>
        )}
        {!!service.discountPercent && (
          <span className="absolute top-2.5 right-2.5 badge bg-accent-500 text-white shadow-sm">{service.discountPercent}% OFF</span>
        )}
        <FavoriteButton
          active={isFavorite}
          onToggle={() => toggleFavorite(service.id)}
          label="service"
          size="sm"
          className={`absolute bottom-2.5 right-2.5 shadow-sm ${service.discountPercent ? '' : ''}`}
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{service.name}</h3>
        {service.description && <p className="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{service.description}</p>}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
          <div>
            <span className="text-xs text-slate-400">Starts at</span>
            <div className="flex items-baseline gap-1.5">
              <p className="font-display font-bold text-brand-600">₹{service.basePrice}</p>
              {!!service.originalPrice && service.originalPrice > service.basePrice && (
                <p className="text-xs text-slate-400 line-through">₹{service.originalPrice}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" /> {service.duration} min
          </div>
        </div>
      </div>
    </Link>
  );
}
