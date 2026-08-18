'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { PreBookingThread } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ChatThreadsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [threads, setThreads] = useState<PreBookingThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login?next=/chat'); return; }
    chatApi.getPreBookingThreads()
      .then((res) => setThreads(res.data.data || res.data || []))
      .catch(() => setThreads([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Messages</h1>

      {threads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Ask a professional a question before booking — start a chat from their profile."
        />
      ) : (
        <div className="card divide-y divide-slate-50">
          {threads.map((t) => (
            <Link
              key={t.counterpartId}
              href={`/chat/${t.counterpartId}`}
              className="flex items-center gap-3.5 p-4 hover:bg-slate-50 transition-colors"
            >
              <Avatar src={t.counterpartAvatar} name={t.counterpartName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900 truncate">{t.counterpartName || 'Service Professional'}</p>
                  <p className="text-[11px] text-slate-400 flex-shrink-0">{format(parseISO(t.lastMessageAt), 'MMM d, h:mm a')}</p>
                </div>
                <p className="text-xs text-slate-500 truncate">{t.lastMessageFromMe ? 'You: ' : ''}{t.lastMessage}</p>
              </div>
              {t.unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-semibold text-white bg-brand-500 rounded-full flex-shrink-0">
                  {t.unreadCount > 9 ? '9+' : t.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
