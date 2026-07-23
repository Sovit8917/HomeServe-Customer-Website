'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supportApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Send, Lock, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TicketMessage {
  id: string;
  senderId: string;
  senderType: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED' | string;
  createdAt: string;
  messages: TicketMessage[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await supportApi.getTicket(id);
      setTicket(res.data.data || res.data);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      toast.error(e.response?.data?.message || 'Failed to load ticket');
      if (e.response?.status === 404 || e.response?.status === 403) router.push('/support');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll for admin replies while the ticket is open, so the customer sees
    // support responses without needing to refresh manually.
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  const isClosed = ticket?.status === 'CLOSED';

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await supportApi.reply(id, message.trim());
      setMessage('');
      await load();
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string } } };
      toast.error(e2.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Close this ticket? You will not be able to reply after closing.')) return;
    setClosing(true);
    try {
      await supportApi.closeTicket(id);
      toast.success('Ticket closed');
      await load();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to close ticket');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/support')} className="p-2 rounded-lg hover:bg-slate-100 flex-shrink-0">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display font-bold text-lg text-slate-900 truncate">{ticket.subject}</h1>
          <p className="text-xs text-slate-400">Raised on {format(parseISO(ticket.createdAt), 'MMM d, yyyy')}</p>
        </div>
        <Badge status={ticket.status} />
      </div>

      <div className="card p-4 mb-4">
        <p className="text-sm text-slate-600 leading-relaxed">{ticket.description}</p>
      </div>

      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {ticket.messages?.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">No replies yet.</p>
        ) : (
          ticket.messages.map((m) => {
            const isMine = m.senderId === user?.id;
            const isAdmin = m.senderType === 'ADMIN';
            const isAi = m.senderType === 'AI';
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : isAdmin
                    ? 'bg-emerald-50 text-slate-800 border border-emerald-100 rounded-bl-sm'
                    : isAi
                    ? 'bg-indigo-50 text-slate-800 border border-indigo-100 rounded-bl-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {isAdmin && !isMine && (
                    <p className="text-[11px] font-semibold text-emerald-600 mb-0.5">Support Team</p>
                  )}
                  {isAi && (
                    <p className="text-[11px] font-semibold text-indigo-500 mb-0.5">AI Assistant (before escalation)</p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                    {format(parseISO(m.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div className="card p-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-50">
          <Lock className="h-4 w-4 flex-shrink-0" />
          This ticket is closed. Raise a new ticket if you need further help.
        </div>
      ) : (
        <div className="space-y-2">
          <form onSubmit={handleReply} className="flex items-end gap-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reply…"
              rows={1}
              className="input-field resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply(e);
                }
              }}
            />
            <button type="submit" disabled={sending || !message.trim()} className="btn-primary px-3.5 py-2.5 flex-shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </form>
          {ticket.status !== 'CLOSED' && (
            <button
              onClick={handleClose}
              disabled={closing}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> {closing ? 'Closing…' : 'Mark as resolved & close ticket'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
