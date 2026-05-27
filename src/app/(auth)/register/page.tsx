'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types/auth';
import { ApiSuccess } from '@/types/api';
import SuccessDialog from '@/components/ui/SuccessDialog';

type Role = 'customer' | 'vendor';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as Role) || 'customer';

  const { setUser, setToken } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: defaultRole,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ message: string; redirect: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post<ApiSuccess<AuthResponse>>('/auth/register', form);
      setUser(data.data.user);
      setToken(data.data.accessToken);

      const redirect = form.role === 'vendor' ? '/vendor/onboarding' : '/';
      setSuccess({ message: data.message ?? 'Account created successfully!', redirect });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md m-6">
      <SuccessDialog
        open={!!success}
        title="Welcome to WashHub!"
        message={success?.message ?? ''}
        actionLabel="Continue"
        onClose={() => {
          if (success) router.push(success.redirect);
        }}
      />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-aqua-500">WashHub</Link>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-aqua-500 font-medium hover:underline">Login</Link>
          </p>
        </div>

        {/* Google OAuth — only for customers */}
        {form.role === 'customer' && (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <GoogleIcon />
            Continue with Google
          </a>
        )}

        {form.role === 'customer' && (
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
              or register with email
            </div>
          </div>
        )}

        {/* Role toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
          {(['customer', 'vendor'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, role: r }))}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${
                form.role === r
                  ? 'bg-white text-aqua-500 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 'vendor' ? 'Car Wash Owner' : 'Customer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400 focus:border-transparent"
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aqua-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
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
            className="w-full py-2.5 px-4 bg-aqua-500 text-white text-sm font-semibold rounded-lg hover:bg-aqua-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
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
