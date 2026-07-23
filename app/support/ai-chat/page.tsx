'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aiSupportApi, AiChatTurn } from '@/lib/api';
import { Send, User as UserIcon, Bot, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface DisplayMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const WELCOME: DisplayMessage = {
  id: 'welcome',
  role: 'model',
  text: "Hi! I'm HomeServe's support assistant. Ask me about bookings, payments, tracking, or subscriptions — and I can connect you to a human agent any time.",
};

export default function AiChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestEscalation, setSuggestEscalation] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const historyForApi = (): AiChatTurn[] =>
    messages.filter((m) => m.id !== 'welcome').map((m) => ({ role: m.role, text: m.text }));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const res = await aiSupportApi.chat(text, [...historyForApi(), { role: 'user', text }]);
      const reply = res.data?.data;
      setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: 'model', text: reply?.reply ?? '' }]);
      setSuggestEscalation(!!reply?.suggestEscalation);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: err.response?.data?.message || "Sorry, I'm having trouble responding. Try again, or talk to a human.",
        },
      ]);
      setSuggestEscalation(true);
    } finally {
      setSending(false);
    }
  };

  const escalate = async () => {
    if (escalating) return;
    setEscalating(true);
    try {
      const res = await aiSupportApi.escalate(historyForApi());
      const ticketId = res.data?.data?.ticketId;
      toast.success('Connecting you to a human agent');
      router.push(ticketId ? `/support/${ticketId}` : '/support');
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Couldn't connect you — try Help & Support instead.");
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-semibold text-slate-900">Support Assistant</h1>
          <p className="text-xs text-slate-400">AI-powered · Instant replies</p>
        </div>
        <button
          onClick={escalate}
          disabled={escalating}
          className="ml-auto flex items-center gap-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-full px-3 py-1.5 hover:bg-brand-100 transition-colors disabled:opacity-50"
        >
          <UserIcon className="h-3.5 w-3.5" /> Talk to human
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-brand-500 text-white rounded-br-sm'
                  : 'bg-slate-100 text-slate-700 rounded-bl-sm'
              }`}
            >
              {m.role === 'model' && (
                <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Bot className="h-3 w-3" /> AI Assistant
                </p>
              )}
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {suggestEscalation && (
        <button
          onClick={escalate}
          className="mb-3 flex items-center justify-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium rounded-xl py-2.5 hover:bg-brand-100 transition-colors"
        >
          <UserIcon className="h-4 w-4" /> Want to talk to a human agent instead? Tap here.
        </button>
      )}

      <form onSubmit={send} className="flex gap-2 pt-2 border-t border-slate-100">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-11 h-11 flex-shrink-0 rounded-xl bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
