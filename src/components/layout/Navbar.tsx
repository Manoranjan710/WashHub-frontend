'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function Navbar() {
  const { user, accessToken, logout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      if (accessToken) await api.post('/auth/logout');
    } catch {
      // best-effort
    } finally {
      logout();
      queryClient.clear();
      router.push('/login');
    }
  };

  const dashboardHref =
    user?.role === 'vendor'   ? '/vendor/dashboard' :
    user?.role === 'admin'    ? '/admin' :
    '/bookings/my';

  return (
    <>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to logout?"
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={() => { setShowLogoutConfirm(false); handleLogout(); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-aqua-500">WashHub</span>
            </Link>

            {/* Nav links */}
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/centers" className="hover:text-aqua-500 transition-colors">
                Find Centers
              </Link>
              {user?.role === 'customer' && (
                <>
                  <Link href="/bookings/my" className="hover:text-aqua-500 transition-colors">
                    My Bookings
                  </Link>
                  <Link href="/vehicles" className="hover:text-aqua-500 transition-colors">
                    My Vehicles
                  </Link>
                </>
              )}
              {user?.role === 'vendor' && (
                <Link href="/vendor/dashboard" className="hover:text-aqua-500 transition-colors">
                  My Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-aqua-500 transition-colors">
                  Admin Panel
                </Link>
              )}
            </div>

            {/* Auth actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="text-sm text-gray-700 font-medium hover:text-aqua-500 transition-colors"
                  >
                    {user.name}
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-600 hover:text-aqua-500 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium px-4 py-2 bg-aqua-500 text-white rounded-lg hover:bg-aqua-600 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
