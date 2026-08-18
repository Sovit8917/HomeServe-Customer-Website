'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    invoicesApi.getOne(id)
      .then((res) => setInvoice(res.data.data || res.data))
      .catch(() => toast.error('Could not load this invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await invoicesApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download invoice PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!invoice) return <EmptyInvoice onBack={() => router.push('/invoices')} />;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <button onClick={() => router.push('/invoices')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Invoices
      </button>

      <div className="card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <p className="font-display text-xl font-bold text-slate-900">{invoice.companyName}</p>
            {invoice.companyGstNumber && <p className="text-xs text-slate-400 mt-0.5">GSTIN: {invoice.companyGstNumber}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-slate-900">{invoice.invoiceNumber}</p>
            <p className="text-xs text-slate-400">{format(parseISO(invoice.issuedAt), 'MMM d, yyyy')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-1">Billed to</p>
            <p className="font-medium text-slate-800">{invoice.customerName}</p>
            {invoice.customerGstNumber && <p className="text-xs text-slate-400">GSTIN: {invoice.customerGstNumber}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Payment method</p>
            <p className="font-medium text-slate-800">{invoice.paymentMethod}</p>
            {invoice.placeOfSupply && <p className="text-xs text-slate-400">Place of supply: {invoice.placeOfSupply}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Description</th>
                <th className="text-center font-medium px-2 py-2.5">Qty</th>
                <th className="text-right font-medium px-4 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoice.lineItems?.map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-2.5 text-slate-700">{item.description}</td>
                  <td className="px-2 py-2.5 text-center text-slate-500">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-800">₹{Number(item.amount).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 text-sm ml-auto max-w-[220px]">
          <Row label="Subtotal" value={invoice.subtotal} />
          {Number(invoice.discountAmount) > 0 && <Row label="Discount" value={-invoice.discountAmount} />}
          <Row label="Taxable amount" value={invoice.taxableAmount} />
          {Number(invoice.cgstAmount) > 0 && <Row label={`CGST`} value={invoice.cgstAmount} />}
          {Number(invoice.sgstAmount) > 0 && <Row label={`SGST`} value={invoice.sgstAmount} />}
          <div className="flex justify-between pt-2 mt-1 border-t border-slate-100 font-display font-bold text-slate-900">
            <span>Total</span>
            <span>₹{Number(invoice.totalAmount).toFixed(0)}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
      >
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download PDF
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-500">
      <span>{label}</span>
      <span className="text-slate-700">₹{Number(value).toFixed(0)}</span>
    </div>
  );
}

function EmptyInvoice({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-slate-500 mb-4">This invoice could not be found.</p>
      <button onClick={onBack} className="btn-secondary">Back to invoices</button>
    </div>
  );
}
