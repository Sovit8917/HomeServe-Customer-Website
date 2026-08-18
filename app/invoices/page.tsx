'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Receipt, ChevronRight, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Deep-linked from a booking — jump straight to that invoice.
    if (bookingId) {
      invoicesApi.getByBooking(bookingId)
        .then((res) => {
          const inv = res.data.data || res.data;
          if (inv?.id) router.replace(`/invoices/${inv.id}`);
          else setLoading(false);
        })
        .catch(() => setLoading(false));
      return;
    }
    invoicesApi.getAll(1, 50)
      .then((res) => {
        const data = res.data.data || res.data || {};
        setInvoices(data.invoices || (Array.isArray(data) ? data : []));
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Invoices &amp; receipts</h1>
      <p className="text-slate-500 text-sm mb-6">Tax invoices for every paid booking, generated automatically.</p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Invoices are generated automatically once a booking is paid for."
        />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`} className="card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all">
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Receipt className="h-5 w-5 text-brand-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 truncate">{inv.invoiceNumber}</p>
                <p className="text-xs text-slate-500">
                  {format(parseISO(inv.issuedAt), 'MMM d, yyyy')}
                  {inv.booking?.id && ` · Booking #${inv.booking.id.slice(0, 8).toUpperCase()}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <p className="font-display font-bold text-slate-800">₹{Number(inv.totalAmount).toFixed(0)}</p>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner size="lg" /></div>}>
      <InvoicesContent />
    </Suspense>
  );
}
