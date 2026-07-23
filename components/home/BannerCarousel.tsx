'use client';
import { useEffect, useState } from 'react';
import { Banner } from '@/types';

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[index];
  const content = (
    <img
      src={banner.image}
      alt={banner.title}
      className="w-full h-32 sm:h-48 object-cover rounded-2xl"
    />
  );

  return (
    <div className="mb-8">
      {banner.link ? (
        <a href={banner.link} target={banner.link.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Show banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand-500' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
