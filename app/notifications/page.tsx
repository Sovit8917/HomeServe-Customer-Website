'use client';
import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.getAll()
      .then((res) => {
        const payload = res.data.data || res.data || {};
        setItems(payload.notifications || (Array.isArray(payload) ? payload : []));
        setUnreadCount(payload.unreadCount || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await notificationsApi.markRead(id); } catch {}
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications yet" description="We'll let you know when something important happens." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => markRead(n.id)}
              className={`w-full text-left card p-4 flex items-start gap-3 transition-colors ${!n.isRead ? 'bg-brand-50/40 border-brand-100' : ''}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.isRead ? 'bg-brand-100' : 'bg-slate-100'}`}>
                <Bell className={`h-4.5 w-4.5 ${!n.isRead ? 'text-brand-600' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-[11px] text-slate-400 mt-1">{formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
