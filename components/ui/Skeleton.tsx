export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer rounded-xl ${className}`} />;
}

export function ServiceCardSkeleton({ isGrid = false }: { isGrid?: boolean }) {
  return (
    <div
      className={`flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-100/90 p-3.5 space-y-3 shadow-xs ${
        isGrid ? 'w-full' : 'w-[240px] sm:w-[270px] shrink-0'
      }`}
    >
      <div className="w-full aspect-[16/10] rounded-xl animate-shimmer" />
      <div className="space-y-2 pt-1">
        <div className="w-14 h-3 animate-shimmer rounded-full" />
        <div className="w-full h-4 animate-shimmer rounded-full" />
        <div className="w-2/3 h-4 animate-shimmer rounded-full" />
      </div>
      <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
        <div className="w-20 h-5 animate-shimmer rounded-full" />
        <div className="w-8 h-8 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-xs"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl animate-shimmer" />
          <div className="w-16 h-3 animate-shimmer rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`w-full aspect-[2/1] rounded-2xl animate-shimmer border border-slate-200/50 shadow-xs ${
              i > 0 ? 'hidden md:block' : 'block'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-center items-center gap-1.5 pt-1">
        <div className="w-7 h-2 rounded-full animate-shimmer" />
        <div className="w-2 h-2 rounded-full animate-shimmer" />
        <div className="w-2 h-2 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}
