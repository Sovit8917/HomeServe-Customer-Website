'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoriesApi, servicesApi, bannersApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Category, Service, Banner } from '@/types';
import BannerCarousel from '@/components/home/BannerCarousel';
import AppServiceCard from '@/components/home/AppServiceCard';
import CategoryGrid from '@/components/home/CategoryGrid';
import { ServiceCardSkeleton, CategoryGridSkeleton, BannerSkeleton, Skeleton } from '@/components/ui/Skeleton';
import {
  RotateCcw,
  Flame,
  ArrowRight,
  Sparkles,
  Wrench,
  Zap,
  Hammer,
  PaintBucket,
  Wind,
  Bug,
  Droplets
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORY_ICONS: Record<string, any> = {
  cleaning: Sparkles, plumbing: Droplets, electrician: Zap, electrical: Zap,
  carpentry: Hammer, painting: PaintBucket, ac: Wind, pest: Bug, default: Sparkles,
};

function getCategoryIcon(name?: string) {
  if (!name) return Sparkles;
  const key = Object.keys(CATEGORY_ICONS).find((k) => name.toLowerCase().includes(k));
  return CATEGORY_ICONS[key || 'default'] || Sparkles;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [deals, setDeals] = useState<Service[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    (async () => {
      try {
        const [catRes, svcRes, bannerRes, dealsRes] = await Promise.all([
          categoriesApi.getAll(),
          servicesApi.getAll(),
          bannersApi.getActive().catch(() => null),
          servicesApi.getDeals().catch(() => null),
        ]);
        setCategories(catRes.data.data || catRes.data || []);
        setServices(svcRes.data.data || svcRes.data || []);
        if (bannerRes) {
          setBanners((bannerRes.data.data || bannerRes.data || []).sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder));
        }
        if (dealsRes) {
          setDeals(dealsRes.data.data || dealsRes.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setRecentlyViewed([]);
      return;
    }
    servicesApi
      .getRecentViews()
      .then((res) => setRecentlyViewed((res.data.data || res.data || []).slice(0, 8)))
      .catch(() => setRecentlyViewed([]));
  }, [user]);

  // Filter services, deals, and recent items by active category pill
  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.categoryId === activeCategory || s.category?.id === activeCategory;
  });

  const filteredDeals = deals.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.categoryId === activeCategory || s.category?.id === activeCategory;
  });

  const filteredRecent = recentlyViewed.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.categoryId === activeCategory || s.category?.id === activeCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
              activeCategory === 'all'
                ? 'bg-emerald-800 text-white shadow-emerald-900/10'
                : 'bg-white border border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <span>All</span>
          </button>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-24 h-9 rounded-full shrink-0" />
            ))
          ) : (
            categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-emerald-900/10'
                      : 'bg-white border border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-emerald-700'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })
          )}
        </div>

        {/* App Promo Banner Carousel (Top) */}
        {loading ? (
          <BannerSkeleton />
        ) : banners.length > 0 ? (
          <BannerCarousel banners={banners} />
        ) : null}

        {/* Section: Limited Offer (Deals & Offers) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span>Limited Offer</span>
            </h2>
            <Link href="/deals" className="text-xs font-semibold text-emerald-800 hover:underline">
              See all offers
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory touch-pan-x">
              {(filteredDeals.length > 0 ? filteredDeals : filteredServices.filter((s) => s.discountPercent)).map((s) => (
                <AppServiceCard
                  key={s.id}
                  service={s}
                  badgeText={`${s.discountPercent || 20}% OFF`}
                  badgeType="discount"
                />
              ))}
            </div>
          )}
        </section>

        {/* Section: Jump Back In (Recently Viewed or Recommended) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-slate-800" />
              <span>Jump Back In</span>
            </h2>
            {recentlyViewed.length > 0 && (
              <Link href="/services" className="text-xs font-semibold text-emerald-800 hover:underline">
                See all
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory touch-pan-x">
              {(filteredRecent.length > 0 ? filteredRecent : filteredServices.slice(0, 4)).map((s) => (
                <AppServiceCard key={s.id} service={s} badgeText="Recent" badgeType="recent" />
              ))}
            </div>
          )}
        </section>

        {/* Categories Section */}
        <section className="space-y-4">
          <h2 className="font-bold text-slate-900 text-lg sm:text-xl">Categories</h2>
          {loading ? (
            <CategoryGridSkeleton />
          ) : (
            <CategoryGrid categories={categories} />
          )}
        </section>

        {/* Popular Services Section */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-lg sm:text-xl">Popular Services</h2>
            <Link href="/services" className="text-xs font-semibold text-emerald-800 flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ServiceCardSkeleton key={i} isGrid />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No services found for this category.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredServices.slice(0, 8).map((s) => (
                <AppServiceCard key={s.id} service={s} className="w-full" />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
