'use client';
import { useState } from 'react';
import { IndianRupee, Loader2 } from 'lucide-react';
import { ExtraChargeRequest } from '@/types';

interface Props {
  request: ExtraChargeRequest;
  // True for CASH-method bookings — only then does the split control show;
  // other payment methods keep the old one-click approve/reject.
  isCashBooking: boolean;
  responding: boolean;
  onReject: () => void;
  onApprove: (cashCollected?: number) => void;
}

/**
 * Approve/reject card for a pending extra-charge request. On a CASH
 * booking, approving reveals a slider for how much of the amount the
 * worker already collected in cash on-site — the rest is left to pay
 * online right after (mirrors BookingsService.respondToExtraCharge's
 * split path). Any other payment method just approves the full amount
 * as before; the split control doesn't apply there.
 */
export default function ExtraChargeApprovalCard({ request, isCashBooking, responding, onReject, onApprove }: Props) {
  const [splitting, setSplitting] = useState(false);
  const [cashAmount, setCashAmount] = useState(request.amount);

  const onlinePortion = Math.max(0, Math.round((request.amount - cashAmount) * 100) / 100);

  if (splitting) {
    return (
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-amber-800 mb-1.5">
            <span>Cash collected on-site</span>
            <span className="font-semibold">₹{cashAmount.toFixed(0)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={request.amount}
            step={1}
            value={cashAmount}
            onChange={(e) => setCashAmount(Number(e.target.value))}
            className="w-full accent-amber-600"
          />
          <div className="flex items-center justify-between text-[11px] text-amber-600 mt-0.5">
            <span>₹0 cash</span>
            <span>₹{request.amount.toFixed(0)} cash</span>
          </div>
        </div>
        {onlinePortion > 0 && (
          <p className="text-xs text-amber-700 bg-amber-100/60 rounded-lg px-3 py-2">
            ₹{onlinePortion.toFixed(0)} will need to be paid online right after you confirm.
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={() => setSplitting(false)} disabled={responding}
            className="btn-secondary flex-1 justify-center flex items-center">
            Back
          </button>
          <button onClick={() => onApprove(cashAmount)} disabled={responding}
            className="btn-primary flex-1 justify-center flex items-center">
            {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button onClick={onReject} disabled={responding}
        className="btn-secondary flex-1 justify-center flex items-center text-red-600 border-red-200 hover:bg-red-50">
        Reject
      </button>
      <button
        onClick={() => (isCashBooking ? setSplitting(true) : onApprove())}
        disabled={responding}
        className="btn-primary flex-1 justify-center flex items-center"
      >
        {responding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
      </button>
    </div>
  );
}
