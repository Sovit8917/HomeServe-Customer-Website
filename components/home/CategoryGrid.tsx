'use client';
import Link from 'next/link';
import { Category } from '@/types';
import { Sparkles, Wrench, Zap, Hammer, PaintBucket, Wind, Bug, Droplets } from 'lucide-react';

const iconMap: Record<string, any> = {
  cleaning: Sparkles, plumbing: Wrench, electrician: Zap, carpentry: Hammer,
  painting: PaintBucket, ac: Wind, pest: Bug, default: Droplets,
};

function getIcon(name: string) {
  const key = Object.keys(iconMap).find(k => name.toLowerCase().includes(k));
  return iconMap[key || 'default'];
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {categories.map((cat) => {
        const Icon = getIcon(cat.name);
        return (
          <Link
            key={cat.id}
            href={`/services?category=${cat.id}`}
            className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100/90 shadow-sm hover:shadow-xl hover:border-brand-300 hover:-translate-y-1.5 transition-all duration-300"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-50/80 border border-brand-100 group-hover:bg-brand-500 flex items-center justify-center transition-all duration-300 shadow-inner group-hover:scale-105">
              <Icon className="h-7 w-7 text-brand-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 text-center leading-snug group-hover:text-brand-600 transition-colors">
              {cat.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
