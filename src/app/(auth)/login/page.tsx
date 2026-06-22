'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types/auth';
import { ApiSuccess } from '@/types/api';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'google_failed'
      ? 'Google sign-in failed. Please try again.'
      : '',
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/login', form);
      setUser(data.data.user);

      const role = data.data.user.role;
      // Honour a ?redirect= target for customers (e.g. a center they tried to
      // book before logging in); admins/vendors always go to their dashboards.
      const redirectParam = searchParams.get('redirect');
      const redirect =
        role === 'admin'  ? '/admin' :
        role === 'vendor' ? '/vendor/dashboard' :
        redirectParam || '/';
      router.push(redirect);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel — hero image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/washhub_login_page_bg.jpg"
          alt="Car wash service"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 bg-gray-50 px-6 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="mb-8 text-center">
              <Link href="/" className="inline-block">
                <Image
                  src="/washhub_logo.jpg"
                  alt="WashHub"
                  width={130}
                  height={44}
                  className="mx-auto object-contain"
                />
              </Link>
              <h1 className="mt-4 text-xl font-semibold text-gray-900">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-aqua-500 font-medium hover:underline">Sign up</Link>
              </p>
            </div>

            {/* Google OAuth */}
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 w-full border border-gray-300 shadow-md rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6"
            >
              <GoogleIcon />
              Continue with Google
            </a>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                or sign in with email
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full shadow-md py-2.5 px-4 bg-aqua-500 text-white text-sm font-semibold rounded-lg hover:bg-aqua-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
              Admin? Use your seeded credentials.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.6 20.5H42V20.4H24V27.6H35.2C33.5 32.2 29.1 35.6 24 35.6C17.4 35.6 12 30.2 12 23.6C12 17 17.4 11.6 24 11.6C27 11.6 29.8 12.7 31.9 14.6L37 9.5C33.5 6.3 29 4.4 24 4.4C13.5 4.4 5 12.9 5 23.4C5 33.9 13.5 42.4 24 42.4C34.5 42.4 43 33.9 43 23.4C43 22.4 42.9 21.4 43.6 20.5Z" fill="#FFC107"/>
      <path d="M6.3 14.7L12.3 19.1C13.9 14.7 18.6 11.6 24 11.6C27 11.6 29.8 12.7 31.9 14.6L37 9.5C33.5 6.3 29 4.4 24 4.4C16.3 4.4 9.7 8.6 6.3 14.7Z" fill="#FF3D00"/>
      <path d="M24 42.4C28.9 42.4 33.3 40.6 36.8 37.5L31.2 32.8C29.2 34.3 26.7 35.2 24 35.2C18.9 35.2 14.6 31.9 12.8 27.3L6.8 31.9C10.2 38.1 16.6 42.4 24 42.4Z" fill="#4CAF50"/>
      <path d="M43.6 20.5H42V20.4H24V27.6H35.2C34.4 29.8 32.9 31.7 31.2 33L31.2 33L36.8 37.7C36.4 38.1 43 33.4 43 23.6C43 22.6 42.9 21.6 43.6 20.5Z" fill="#1976D2"/>
    </svg>
  );
}
