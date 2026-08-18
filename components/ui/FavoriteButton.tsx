'use client';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FavoriteButton({
  active,
  onToggle,
  label = 'Favorite',
  className = '',
  size = 'md',
}: {
  active: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconDims = size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5';

  return (
    <button
      type="button"
      aria-label={active ? `Remove from ${label.toLowerCase()}s` : `Add to ${label.toLowerCase()}s`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
        toast.success(active ? `Removed from favorites` : `Added to favorites`, { icon: active ? '💔' : '❤️' });
      }}
      className={`${dims} rounded-full flex items-center justify-center backdrop-blur transition-colors flex-shrink-0 ${
        active ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-500 hover:text-red-500'
      } ${className}`}
    >
      <Heart className={iconDims} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
