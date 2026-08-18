'use client';

import { useEffect, useState } from 'react';
import { Banner } from '@/types';

export default function BannerCarousel({
  banners,
}: {
  banners: Banner[];
  isHero?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const bannerList = banners || [];
  const total = bannerList.length;

  // Continuous rotation timer: shift cards every 3.5s
  useEffect(() => {
    if (total <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 3500);

    return () => clearInterval(timer);
  }, [total]);

  if (total === 0) return null;

  // On desktop, display 3 rotating cards side-by-side
  const item1 = bannerList[activeIndex % total];
  const item2 = bannerList[(activeIndex + 1) % total];
  const item3 = bannerList[(activeIndex + 2) % total];

  const desktopCards = total >= 3 ? [item1, item2, item3] : bannerList;

  return (
    <div className="w-full space-y-3">
      {/* Desktop View: 3-Card Continuous Rotating Grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-3 sm:gap-4">
        {desktopCards.map((item, posIdx) => {
          if (!item) return null;
          return (
            <div
              key={`${item.id || posIdx}-${activeIndex}`}
              className="
                relative
                group
                w-full
                aspect-[2/1]
                overflow-hidden
                rounded-2xl
                bg-slate-100
                shadow-sm
                border
                border-slate-200/80
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
                duration-500
                ease-out
                cursor-pointer
                animate-fade-in
              "
            >
              {item.link ? (
                <a
                  href={item.link}
                  target={item.link.startsWith('http') ? '_blank' : undefined}
                  rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="absolute inset-0 block overflow-hidden"
                >
                  <img
                    src={item.image}
                    alt={item.title || 'Promo Banner'}
                    className="
                      absolute
                      inset-0
                      w-full
                      h-full
                      object-cover
                      object-center
                      group-hover:scale-105
                      transition-transform
                      duration-700
                      ease-out
                    "
                  />
                </a>
              ) : (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title || 'Promo Banner'}
                    className="
                      absolute
                      inset-0
                      w-full
                      h-full
                      object-cover
                      object-center
                      group-hover:scale-105
                      transition-transform
                      duration-700
                      ease-out
                    "
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile View: Single Rotating Banner Slide */}
      <div className="block md:hidden">
        {bannerList[activeIndex % total] && (
          <div
            key={`mobile-${activeIndex}`}
            className="
              relative
              group
              w-full
              aspect-[2/1]
              overflow-hidden
              rounded-2xl
              bg-slate-100
              shadow-sm
              border
              border-slate-200/80
              transition-all
              duration-500
              ease-out
            "
          >
            {bannerList[activeIndex % total].link ? (
              <a
                href={bannerList[activeIndex % total].link}
                target={bannerList[activeIndex % total].link?.startsWith('http') ? '_blank' : undefined}
                rel={bannerList[activeIndex % total].link?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="absolute inset-0 block overflow-hidden"
              >
                <img
                  src={bannerList[activeIndex % total].image}
                  alt={bannerList[activeIndex % total].title || 'Promo Banner'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </a>
            ) : (
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={bannerList[activeIndex % total].image}
                  alt={bannerList[activeIndex % total].title || 'Promo Banner'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Smooth Indicator Dots */}
      {total > 1 && (
        <div className="flex justify-center items-center gap-1.5 pt-1">
          {bannerList.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-7 bg-emerald-700 shadow-sm'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}