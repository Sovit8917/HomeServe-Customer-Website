export default function Avatar({ src, name, size = 'md' }: { src?: string; name?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base', xl: 'h-20 w-20 text-xl' }[size];
  const initials = name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (src) return <img src={src} alt={name || 'Avatar'} className={`${s} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}
