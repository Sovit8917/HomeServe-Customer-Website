'use client';
import { KeyRound } from 'lucide-react';

/**
 * Shown to the customer once a worker has been ACCEPTED but hasn't started
 * the job yet. The 4-digit code is generated server-side (Booking.startOtp)
 * and must be read out to the worker, who enters it to flip the booking to
 * IN_PROGRESS — proves the worker is on-site with the right customer.
 */
export default function StartOtpCard({ otp }: { otp: string }) {
  return (
    <div className="card p-5 mb-4 bg-brand-50 border-brand-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
          <KeyRound className="h-5 w-5 text-brand-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-900">Share this code to start the job</p>
          <p className="text-xs text-brand-700 mt-0.5 mb-3">
            Your professional will ask for this code on arrival. Don't share it with anyone else.
          </p>
          <div className="flex gap-2">
            {otp.split('').map((digit, i) => (
              <div key={i} className="w-11 h-12 rounded-xl bg-white border border-brand-200 flex items-center justify-center font-display text-xl font-bold text-brand-700 tracking-wide">
                {digit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
