import { LucideIcon } from 'lucide-react';
export default function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-brand-400" />
      </div>
      <h3 className="text-slate-800 font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
