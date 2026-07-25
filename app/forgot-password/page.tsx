'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Enter your email');
    setLoading(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      });
      if (error) throw new Error(error.message);
      setSent(true);
    } catch (err: any) {
      // Deliberately vague — don't confirm/deny whether the email exists,
      // to avoid leaking which emails are registered.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>

        {sent ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
            <h1 className="font-display text-xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-sm text-slate-500">
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. It expires in 1 hour.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
