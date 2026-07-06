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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
      {categories.map((cat) => {
        const Icon = getIcon(cat.name);
        return (
          <Link key={cat.id} href={`/services?category=${cat.id}`}
            className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-card-hover transition-all duration-200">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-500 flex items-center justify-center transition-colors duration-200">
              <Icon className="h-6 w-6 text-brand-500 group-hover:text-white transition-colors duration-200" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-700 text-center leading-tight">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
