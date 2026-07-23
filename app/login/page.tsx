'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { signIn, signUp } from '@/lib/auth-client';
import toast from 'react-hot-toast';
import { Phone, ShieldCheck, ArrowLeft, Mail, Lock } from 'lucide-react';

function LoginContent() {
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [emailForm, setEmailForm] = useState({ email: '', password: '', name: '' });
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);

  // After Better Auth confirms a session (Google or email/password), swap
  // it for a NestJS JWT via the bridge route so the rest of the site
  // keeps working exactly like the phone-OTP flow (same setAuth call).
  const completeWithBackendToken = async () => {
    const res = await fetch('/api/auth/backend-token', { method: 'POST' });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.message || 'Could not complete sign-in');
    const { user, token } = body.data;
    setAuth(user, token);
    return { user, isNew: false };
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: `/login/complete${
          searchParams.get('next') ? `?next=${encodeURIComponent(searchParams.get('next')!)}` : ''
        }`,
      });
      // signIn.social redirects the browser to Google — code after this
      // line won't run for this request.
    } catch (err: any) {
      toast.error(err?.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.email || !emailForm.password) {
      return toast.error('Enter your email and password');
    }
    setLoading(true);
    try {
      if (emailMode === 'signup') {
        if (!emailForm.name.trim()) {
          setLoading(false);
          return toast.error('Enter your name');
        }
        const { error } = await signUp.email({
          email: emailForm.email,
          password: emailForm.password,
          name: emailForm.name,
        });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await signIn.email({
          email: emailForm.email,
          password: emailForm.password,
        });
        if (error) throw new Error(error.message);
      }

      const { user: loggedInUser } = await completeWithBackendToken();
      toast.success(`Welcome${loggedInUser.name ? `, ${loggedInUser.name}` : ''}!`);
      const next = searchParams.get('next');
      router.push(next && next !== '/login' ? next : '/');
    } catch (err: any) {
      toast.error(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

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

          {/* Google — always visible regardless of mode */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors mb-4 disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z" />
              <path fill="#FBBC05" d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.4l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 text-sm font-medium rounded-md py-1.5 transition-colors ${mode === 'phone' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Phone OTP
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 text-sm font-medium rounded-md py-1.5 transition-colors ${mode === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Email
            </button>
          </div>

          {mode === 'email' ? (
            <>
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">
                {emailMode === 'signup' ? 'Create account' : 'Welcome back'}
              </h1>
              <p className="text-sm text-slate-500 mb-6">
                {emailMode === 'signup' ? 'Sign up with your email to continue.' : 'Sign in with your email to continue.'}
              </p>
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {emailMode === 'signup' && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full name</label>
                    <input
                      type="text"
                      value={emailForm.name}
                      onChange={(e) => setEmailForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Doe"
                      className="input-field"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="input-field pl-10"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center">
                  {loading ? 'Please wait...' : emailMode === 'signup' ? 'Create account' : 'Sign in'}
                </button>
              </form>
              <p className="text-center text-sm text-slate-500 mt-4">
                {emailMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setEmailMode(emailMode === 'signup' ? 'signin' : 'signup')}
                  className="text-brand-600 font-medium hover:underline"
                >
                  {emailMode === 'signup' ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </>
          ) : step === 'phone' ? (
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
