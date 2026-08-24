'use client';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { Service } from '@/types';

interface InclusionsExclusionsProps {
  service?: Service | null;
  includes?: string[] | string;
  excludes?: string[] | string;
}

function parseBackendList(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean);
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
      } catch (_) {}
    }
    return trimmed.split(/\n|,|;/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

export default function ServiceInclusionsExclusions({ service, includes, excludes }: InclusionsExclusionsProps) {
  const s = service as any;

  // Extract from props or backend fields: includedItems & excludedItems (primary), or includes/excludes fallbacks
  const incItems = parseBackendList(
    includes ||
    s?.includedItems ||
    s?.includes ||
    s?.included ||
    s?.inclusions ||
    s?.whatsIncluded ||
    s?.highlights
  );

  const excItems = parseBackendList(
    excludes ||
    s?.excludedItems ||
    s?.excludes ||
    s?.excluded ||
    s?.exclusions ||
    s?.whatsNotIncluded
  );

  // If both includedItems and excludedItems are empty, hide section (as specified by admin settings)
  if (incItems.length === 0 && excItems.length === 0) {
    return null;
  }

  return (
    <div className="card p-5 sm:p-6 mb-6">
      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-600" />
        What's Included & What's Not Included
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Included */}
        {incItems.length > 0 ? (
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> What's Included
            </p>
            <ul className="space-y-2.5">
              {incItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Not Included */}
        {excItems.length > 0 ? (
          <div className="bg-rose-50/60 rounded-xl p-4 border border-rose-100">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-3 flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-rose-600" /> What's Not Included
            </p>
            <ul className="space-y-2.5">
              {excItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                  <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
