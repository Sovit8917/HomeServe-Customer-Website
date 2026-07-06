'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { chatApi, bookingsApi } from '@/lib/api';
import { getChatSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth';
import { ChatMessage, Booking } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import { ChevronLeft, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function BookingChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }

    bookingsApi.getOne(id).then((res) => setBooking(res.data.data || res.data));

    chatApi.getMessages(id).then((res) => {
      const data = res.data.data || res.data || [];
      setMessages(Array.isArray(data) ? data : data.items || []);
    }).finally(() => setLoading(false));

    const socket = getChatSocket();
    socket.emit('join-booking', { bookingId: id });

    const onNewMessage = (msg: ChatMessage) => {
      if (msg.bookingId !== id) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    };
    socket.on('new-message', onNewMessage);
    socket.emit('mark-read', { bookingId: id });

    return () => {
      socket.off('new-message', onNewMessage);
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setText('');
    try {
      const socket = getChatSocket();
      socket.emit('send-message', { bookingId: id, message, senderType: user?.role || 'CUSTOMER' });
      // REST fallback ensures persistence even if socket delivery is delayed.
      const res = await chatApi.sendMessage(id, message);
      const saved = res.data.data || res.data;
      setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
    } catch {
      // Message may still arrive via socket broadcast; no-op on REST failure.
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
        <button onClick={() => router.push(`/bookings/${id}`)} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <Avatar src={booking?.worker?.avatar} name={booking?.worker?.name} size="sm" />
        <div>
          <p className="font-semibold text-sm text-slate-900">{booking?.worker?.name || 'Service Professional'}</p>
          <p className="text-xs text-slate-400">{booking?.items?.[0]?.service?.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-10">Say hello to get started 👋</p>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-brand-500 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                <p>{m.message}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                  {format(parseISO(m.createdAt), 'h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-t border-slate-100">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="input-field flex-1"
        />
        <button onClick={handleSend} disabled={sending || !text.trim()} className="w-11 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 flex items-center justify-center text-white flex-shrink-0">
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
