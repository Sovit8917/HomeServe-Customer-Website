'use client';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, PlayCircle, Images } from 'lucide-react';

interface Props {
  images: string[];
  videoUrl?: string;
}

/**
 * Photo strip + optional walkthrough video for a service's detail page.
 * Renders nothing if there's no gallery content — Service.images/videoUrl
 * are only ever populated when an admin has actually set them, never
 * fabricated, so an empty/missing gallery is the normal case for most
 * services and this section just doesn't take up space then.
 */
export default function ServiceGallery({ images, videoUrl }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = images || [];

  if (photos.length === 0 && !videoUrl) return null;

  const showPrev = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  const showNext = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length));

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <h2 className="section-title flex items-center gap-2 mb-4">
        <Images className="h-4.5 w-4.5 text-brand-500" /> Gallery
      </h2>

      {videoUrl && (
        <div className="rounded-xl overflow-hidden bg-slate-900 mb-4 aspect-video">
          <video
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          >
            Your browser doesn't support embedded video.
          </video>
        </div>
      )}

      {photos.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
            >
              <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="h-7 w-7" />
          </button>
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showPrev(); }}
              className="absolute left-3 sm:left-6 text-white/80 hover:text-white p-2"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          <img
            src={photos[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); showNext(); }}
              className="absolute right-3 sm:right-6 text-white/80 hover:text-white p-2"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
          <span className="absolute bottom-4 text-xs text-white/60">{lightboxIndex + 1} / {photos.length}</span>
        </div>
      )}
    </div>
  );
}
