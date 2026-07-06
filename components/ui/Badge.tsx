const variants: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  ACCEPTED: 'bg-blue-50 text-blue-700 border border-blue-200',
  IN_PROGRESS: 'bg-purple-50 text-purple-700 border border-purple-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  SUCCESS: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border border-red-200',
  CREDIT: 'bg-emerald-50 text-emerald-600',
  DEBIT: 'bg-red-50 text-red-600',
  OPEN: 'bg-amber-50 text-amber-700 border border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-500 border border-slate-200',
};
const labels: Record<string, string> = { IN_PROGRESS: 'In Progress' };
export default function Badge({ status }: { status: string }) {
  const cls = variants[status] || 'bg-slate-100 text-slate-600 border border-slate-200';
  return <span className={`badge ${cls}`}>{labels[status] || status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}
