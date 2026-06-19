'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/axios';

export default function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  );
}

function OAuthCallbackContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      router.replace('/login?error=google_failed');
      return;
    }

    // The backend already set the auth cookies before redirecting here, so the
    // /auth/me call is authenticated by the cookie (sent via withCredentials).
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.data);
        const role = data.data.role as string;
        const redirect = role === 'vendor' ? '/vendor/dashboard' : role === 'admin' ? '/admin' : '/';
        router.replace(redirect);
      })
      .catch(() => {
        router.replace('/login?error=google_failed');
      });
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <span className="w-10 h-10 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin inline-block" />
        <p className="text-sm text-gray-500">Signing you in with Google…</p>
      </div>
    </div>
  );
}
