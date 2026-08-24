'use client';
import { useEffect, useState } from 'react';
import { X, Loader2, Share2, Copy, Check, MessageCircle } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ShareTrackingModal({ bookingId, onClose }: {
  bookingId: string; onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bookingsApi.getShareLink(bookingId)
      .then((res) => {
        const { shareToken } = res.data.data || res.data;
        setShareUrl(`${window.location.origin}/track/${shareToken}`);
      })
      .catch(() => toast.error('Could not create a share link'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleWhatsappShare = () => {
    const text = encodeURIComponent(`Track my HomeServe professional's live location: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'Track my HomeServe booking', url: shareUrl });
      } catch {
        // User cancelled the native share sheet — no-op.
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-500" /> Share live tracking
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4">
            Anyone with this link can watch your professional's live location and job status — no account or app needed. It stops showing location once the job is done.
          </p>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
          ) : shareUrl ? (
            <>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 mb-4">
                <p className="flex-1 min-w-0 text-xs text-slate-600 truncate">{shareUrl}</p>
                <button onClick={handleCopy} className="flex-shrink-0 text-brand-600 hover:text-brand-700" aria-label="Copy link">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={handleWhatsappShare}
                  className="flex-1 justify-center flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-4 py-2.5 transition-colors text-sm">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
                <button onClick={handleNativeShare} className="btn-secondary flex-1 justify-center flex items-center gap-2 text-sm">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-red-500 text-center py-4">Could not create a share link. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
