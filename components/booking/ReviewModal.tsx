'use client';
import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { reviewsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReviewModal({ bookingId, workerName, onClose, onSubmitted }: {
  bookingId: string; workerName?: string; onClose: () => void; onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    setSubmitting(true);
    try {
      await reviewsApi.create({ bookingId, rating, comment });
      toast.success('Thanks for your feedback!');
      onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-display font-bold text-lg text-slate-900">Rate your experience</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4 text-center">How was your service{workerName ? ` with ${workerName}` : ''}?</p>
          <div className="flex justify-center gap-1.5 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i)}>
                <Star className={`h-9 w-9 transition-colors ${i <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share more about your experience (optional)"
            className="input-field resize-none mb-4" rows={3} />
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full justify-center flex items-center">
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  );
}
