'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error('Invalid or expired reset link');
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      if (error) throw new Error(error.message);
      setDone(true);
      toast.success('Password reset — you can now sign in');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err?.message || 'Reset link is invalid or expired — request a new one');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
            <h1 className="font-display text-xl font-bold text-slate-900 mb-2">Password reset!</h1>
            <p className="text-sm text-slate-500">Redirecting you to login...</p>
          </div>
        ) : !token ? (
          <div className="text-center py-6">
            <p className="text-slate-600 mb-4">This reset link is invalid or missing a token.</p>
            <a href="/forgot-password" className="btn-primary inline-flex">Request a new link</a>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-slate-900 mb-1">Set a new password</h1>
            <p className="text-sm text-slate-500 mb-6">Choose a new password for your account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="input-field pl-10"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center">
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
