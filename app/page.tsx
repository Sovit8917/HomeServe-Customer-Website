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
  Droplets,
  Star
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
  const [popularServices, setPopularServices] = useState<Service[]>([]);
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
        const [catRes, svcRes, popRes, bannerRes, dealsRes] = await Promise.all([
          categoriesApi.getAll().catch(() => ({ data: [] })),
          servicesApi.getAll().catch(() => ({ data: [] })),
          servicesApi.getPopular().catch(() => ({ data: [] })),
          bannersApi.getActive().catch(() => null),
          servicesApi.getDeals().catch(() => null),
        ]);
        setCategories(catRes.data?.data || catRes.data || []);
        setServices(svcRes.data?.data || svcRes.data || []);
        setPopularServices(popRes.data?.data || popRes.data || []);
        if (bannerRes) {
          setBanners((bannerRes.data?.data || bannerRes.data || []).sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder));
        }
        if (dealsRes) {
          setDeals(dealsRes.data?.data || dealsRes.data || []);
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

  // Services sorted for Top Rated section (from popular API or sorted by rating)
  const filteredPopular = popularServices.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.categoryId === activeCategory || s.category?.id === activeCategory;
  });

  const getRatingNum = (s: Service) => s.rating ?? s.avgRating ?? s.averageRating ?? 0;

  // Filter for services rated 4.0+ (above 4.0), falling back to catalog sorted by rating
  const candidateList = filteredPopular.length > 0 ? filteredPopular : filteredServices;
  const ratingAbove40 = candidateList.filter((s) => getRatingNum(s) >= 4.0);
  const topRatedServices = (ratingAbove40.length > 0 ? ratingAbove40 : candidateList)
    .sort((a, b) => getRatingNum(b) - getRatingNum(a));

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-xs ${
              activeCategory === 'all'
                ? 'bg-[#126b4c] text-white shadow-emerald-900/10'
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-xs ${
                    isActive
                      ? 'bg-[#126b4c] text-white shadow-emerald-900/10'
                      : 'bg-white border border-slate-200/80 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[#126b4c]'}`} />
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

        {/* Section 1: "Still looking for these?" Container (Peach Spotlight - slightly darker) */}
        <section className="bg-[#fcdbc7]/90 rounded-3xl p-4 sm:p-6 border border-amber-200/80 shadow-xs space-y-3 sm:space-y-4">
          <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl font-sans tracking-tight">
            Still looking for these?
          </h2>

          {loading ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x">
              {(filteredRecent.length > 0 ? filteredRecent : filteredServices.slice(0, 6)).map((s) => (
                <AppServiceCard
                  key={s.id}
                  service={s}
                  variant="still-looking"
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 2: "Top Rated Near You" Container (Mint Green Spotlight - slightly darker) */}
        <section className="bg-[#d4efe1]/90 rounded-3xl p-4 sm:p-6 border border-emerald-200/80 shadow-xs space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span>Top Rated Near You</span>
            </h2>
            <Link href="/services" className="text-xs sm:text-sm font-bold text-teal-700 hover:underline">
              See all
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
              {Array.from({ length: 4 }).map((_, i) => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x">
              {topRatedServices.slice(0, 8).map((s) => (
                <AppServiceCard
                  key={s.id}
                  service={s}
                  variant="top-rated"
                />
              ))}
            </div>
          )}
        </section>

        {/* Section 3: "Price Drop" */}
        <section className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span>Price Drop</span>
            </h2>
            <Link href="/deals" className="text-xs font-bold text-[#126b4c] hover:underline">
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

        {/* Categories Section */}
        <section className="space-y-4">
          <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">Categories</h2>
          {loading ? (
            <CategoryGridSkeleton />
          ) : (
            <CategoryGrid categories={categories} />
          )}
        </section>

        {/* Premium Split Spotlight Section: Left 4 Cards + Right 6 Cards Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* Left Spotlight Container: 4 Cards (2x2 Grid) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#d4efe1] via-[#e6f6ee] to-[#cdeee0] rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-300/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xs border border-emerald-100/80">
                  <Sparkles className="h-5 w-5 text-[#126b4c] fill-emerald-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">
                      Popular Services
                    </h2>
                    <span className="bg-[#126b4c]/10 text-[#126b4c] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Top Picks
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">Most ordered choices near you</p>
                </div>
              </div>

              <Link
                href="/services"
                className="group flex items-center gap-1 text-xs font-extrabold text-[#126b4c] hover:text-[#0d543b] transition-colors whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ServiceCardSkeleton key={i} isGrid />
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No services found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredServices.slice(0, 4).map((s) => (
                    <AppServiceCard key={s.id} service={s} className="w-full hover:-translate-y-1 transition-transform" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Spotlight Container: 6 Cards (3x2 Grid) */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#fcdbc7] via-[#fef0e7] to-[#fbd4bc] rounded-3xl p-5 sm:p-6 border border-amber-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-300/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xs border border-amber-100/80">
                  <Flame className="h-5 w-5 text-amber-600 fill-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl leading-tight">
                      Trending &amp; Most Booked
                    </h2>
                    <span className="bg-amber-600/10 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Hot Deals
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">High demand &amp; exclusive offers</p>
                </div>
              </div>

              <Link
                href="/deals"
                className="group flex items-center gap-1 text-xs font-extrabold text-amber-900 hover:text-amber-950 transition-colors whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ServiceCardSkeleton key={i} isGrid />
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No services found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {(filteredServices.length >= 10
                    ? filteredServices.slice(4, 10)
                    : filteredServices.slice(0, 6)
                  ).map((s) => (
                    <AppServiceCard key={s.id} service={s} className="w-full hover:-translate-y-1 transition-transform" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
