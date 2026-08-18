'use client';
import Link from 'next/link';
import { Service } from '@/types';
import { Clock, ArrowRight, Sparkles, Wrench, Zap, Hammer, PaintBucket, Wind, Bug, Droplets } from 'lucide-react';
import { useFavoritesStore } from '@/store/favorites';
import FavoriteButton from '@/components/ui/FavoriteButton';

const CATEGORY_ICONS: Record<string, any> = {
  cleaning: Sparkles, plumbing: Wrench, electrician: Zap, electrical: Zap,
  carpentry: Hammer, painting: PaintBucket, ac: Wind, pest: Bug, default: Droplets
};

function getIcon(name?: string) {
  if (!name) return Sparkles;
  const key = Object.keys(CATEGORY_ICONS).find((k) => name.toLowerCase().includes(k));
  return CATEGORY_ICONS[key || 'default'] || Sparkles;
}

interface AppServiceCardProps {
  service: Service;
  badgeText?: string;
  badgeType?: 'recent' | 'discount' | 'popular';
  className?: string;
}

export default function AppServiceCard({ service, badgeText, badgeType, className }: AppServiceCardProps) {
  const Icon = getIcon(service.category?.name);
  const isFavorite = useFavoritesStore((s) => s.isFavoriteService(service.id));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavoriteService);

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group relative flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 overflow-hidden ${className || 'w-[240px] sm:w-[270px] shrink-0 snap-start'}`}
    >
      {/* Top Image / Graphic Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950 flex flex-col items-center justify-center p-4 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-2 shadow-inner">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">{service.category?.name || 'SERVICE'}</span>
          </div>
        )}

        {/* Badge overlay (e.g. Recent or Discount) */}
        {badgeText ? (
          <div
            className={`absolute top-3 left-3 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
              badgeType === 'discount'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-900/70 text-white'
            }`}
          >
            {badgeType === 'recent' && <Clock className="h-3 w-3 text-emerald-300" />}
            <span>{badgeText}</span>
          </div>
        ) : service.discountPercent ? (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
            {service.discountPercent}% OFF
          </div>
        ) : null}

        {/* Favorite Button */}
        <FavoriteButton
          active={isFavorite}
          onToggle={() => toggleFavorite(service.id)}
          label="service"
          size="sm"
          className="absolute top-3 right-3 shadow-md bg-white/90 hover:bg-white text-slate-700"
        />
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase mb-1 block">
            {service.category?.name || 'SERVICE'}
          </span>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 mb-2 group-hover:text-emerald-800 transition-colors">
            {service.name}
          </h3>
        </div>

        {/* Bottom Row: Price & Action Arrow Button */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-50">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold text-slate-900 text-base sm:text-lg">
                ₹{service.basePrice}
              </span>
              {!!service.originalPrice && service.originalPrice > service.basePrice && (
                <span className="text-xs text-slate-400 line-through">₹{service.originalPrice}</span>
              )}
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-emerald-800 text-white group-hover:bg-emerald-700 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
