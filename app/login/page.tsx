'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { Phone, ShieldCheck, ArrowLeft } from 'lucide-react';

function LoginContent() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  // Covers the case where zustand rehydrates a still-valid session on this
  // very page (e.g. an older session that predates cookie-based middleware
  // gating) — bounce straight to where the user was headed instead of
  // leaving them stuck looking at the login form while already signed in.
  useEffect(() => {
    if (user) {
      const next = searchParams.get('next');
      router.replace(next && next !== '/login' ? next : '/');
    }
  }, [user]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.length < 10) return toast.error('Enter a valid 10-digit phone number');
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      toast.success('OTP sent successfully');
      setStep('otp');
      setResendTimer(30);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the complete 6-digit code');
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, code);
      const { user, accessToken, token, isNew } = res.data.data || res.data;
      setAuth(user, accessToken || token);
      toast.success(`Welcome${user.name ? `, ${user.name}` : ''}!`);

      const next = searchParams.get('next');
      if (isNew) {
        router.push(`/onboarding${next ? `?next=${encodeURIComponent(next)}` : ''}`);
      } else {
        router.push(next && next !== '/login' ? next : '/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white text-sm font-bold">HS</span>
          </div>

          {step === 'phone' ? (
            <>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
              <p className="text-sm text-slate-500 mb-6">Sign in with your phone number to continue.</p>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="input-field pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center">
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-brand-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Verify your number</h1>
              <p className="text-sm text-slate-500 mb-6">Enter the 6-digit code sent to <span className="font-medium text-slate-700">+91 {phone}</span></p>

              <div className="flex gap-2 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-full h-12 sm:h-14 text-center text-lg sm:text-xl font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary w-full justify-center flex items-center mb-4">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <p className="text-center text-sm text-slate-500">
                {resendTimer > 0 ? (
                  <>Resend code in {resendTimer}s</>
                ) : (
                  <button onClick={() => handleSendOtp()} className="text-brand-600 font-medium hover:underline">Resend OTP</button>
                )}
              </p>
            </>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
        <p className="text-center text-sm text-gray-500 mt-4">
            Want to become a worker?{' '}
            <a href="https://homeserve-worker-f.onrender.com" className="text-blue-600 font-semibold hover:underline">Worker App →</a>
          </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center" />}>
      <LoginContent />
    </Suspense>
  );
}
