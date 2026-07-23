'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supportApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { LifeBuoy, ChevronDown, Send, Plus, X, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Faq { id: string; question: string; answer: string }
interface Ticket { id: string; subject: string; description: string; status: string; createdAt: string }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    supportApi.getMyTickets().then((res) => setTickets(res.data.data || res.data || [])).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    supportApi.getFaqs().then((res) => setFaqs(res.data.data || res.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return toast.error('Please fill in all fields');
    setSubmitting(true);
    try {
      await supportApi.createTicket({ subject, description });
      toast.success('Ticket created — we\'ll get back to you soon');
      setSubject(''); setDescription(''); setShowForm(false);
      load();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-1">Help & Support</h1>
          <p className="text-slate-500 text-sm">We're here to help with anything you need.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3.5 flex-shrink-0">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New ticket</span>
        </button>
      </div>

      <a
        href="/support/ai-chat"
        className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 mb-8 hover:bg-brand-100 transition-colors"
      >
        <span className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center flex-shrink-0">💬</span>
        <div>
          <p className="font-semibold text-slate-800 text-sm">Chat with our AI Assistant</p>
          <p className="text-xs text-slate-500">Get instant answers, or connect to a human agent any time.</p>
        </div>
        <ChevronRight className="h-4 w-4 text-brand-500 ml-auto flex-shrink-0" />
      </a>

      {/* My tickets */}
      <section className="mb-8">
        <h2 className="font-semibold text-slate-800 mb-3">My tickets</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : tickets.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
            <LifeBuoy className="h-8 w-8 text-slate-300" />
            No support tickets yet.
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <Link key={t.id} href={`/support/${t.id}`} className="card p-4 block hover:border-brand-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-slate-800">{t.subject}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={t.status} />
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-1">{t.description}</p>
                <p className="text-[11px] text-slate-400">{format(parseISO(t.createdAt), 'MMM d, yyyy')}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FAQ */}
      <section>
        <h2 className="font-semibold text-slate-800 mb-3">Frequently asked questions</h2>
        {faqs.length === 0 ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <div className="card divide-y divide-slate-50">
            {faqs.map((faq, i) => (
              <div key={faq.id}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                  <span className="text-sm font-medium text-slate-800 pr-4">{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-4 pb-4 text-sm text-slate-500 leading-relaxed">{faq.answer}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-lg text-slate-900">Raise a ticket</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your issue in detail" className="input-field resize-none" rows={4} />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center flex items-center gap-1.5">
                <Send className="h-4 w-4" /> {submitting ? 'Sending...' : 'Submit ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
