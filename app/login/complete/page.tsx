'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

function CompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/backend-token', { method: 'POST' });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.message || 'Could not complete sign-in');

        const { user, token } = body.data;
        setAuth(user, token);
        toast.success(`Welcome${user.name ? `, ${user.name}` : ''}!`);

        const next = searchParams.get('next');
        router.replace(next && next !== '/login' ? next : '/');
      } catch (err: any) {
        toast.error(err?.message || 'Sign-in failed, please try again');
        setFailed(true);
      }
    })();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      {failed ? (
        <div className="text-center">
          <p className="text-slate-600 mb-4">Something went wrong finishing sign-in.</p>
          <button onClick={() => router.replace('/login')} className="btn-primary">
            Back to login
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Finishing sign-in...</p>
        </div>
      )}
    </div>
  );
}

export default function LoginCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center" />}>
      <CompleteContent />
    </Suspense>
  );
}
