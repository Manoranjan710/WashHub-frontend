'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  const [mobileOpen, setMobileOpen]               = useState(false);

  const closeMobile = () => setMobileOpen(false);

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
    user?.role === 'vendor' ? '/vendor/dashboard' :
    user?.role === 'admin'  ? '/admin' :
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
            <Link href="/" className="flex items-center" onClick={closeMobile}>
              <Image src="/washhub_logo.jpg" alt="WashHub" width={110} height={36} className="object-contain" />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/centers" className="hover:text-aqua-500 transition-colors">Find Centers</Link>
              {user?.role === 'customer' && (
                <>
                  <Link href="/bookings/my" className="hover:text-aqua-500 transition-colors">My Bookings</Link>
                  <Link href="/vehicles"    className="hover:text-aqua-500 transition-colors">My Vehicles</Link>
                </>
              )}
              {user?.role === 'vendor' && (
                <Link href="/vendor/dashboard" className="hover:text-aqua-500 transition-colors">My Dashboard</Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-aqua-500 transition-colors">Admin Panel</Link>
              )}
            </div>

            {/* Right side — desktop auth + mobile hamburger */}
            <div className="flex items-center gap-3">
              {/* Desktop auth */}
              <div className="hidden sm:flex items-center gap-3">
                {user ? (
                  <>
                    <Link href={dashboardHref} className="text-sm text-gray-700 font-medium hover:text-aqua-500 transition-colors">
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
                    <Link href="/login"    className="text-sm font-medium text-gray-600 hover:text-aqua-500 transition-colors">Login</Link>
                    <Link href="/register" className="text-sm font-medium px-4 py-2 bg-aqua-500 text-white rounded-lg hover:bg-aqua-600 transition-colors">
                      Get Started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
            <MobileLink href="/centers"      onClick={closeMobile}>Find Centers</MobileLink>

            {user?.role === 'customer' && (
              <>
                <MobileLink href="/bookings/my" onClick={closeMobile}>My Bookings</MobileLink>
                <MobileLink href="/vehicles"    onClick={closeMobile}>My Vehicles</MobileLink>
              </>
            )}
            {user?.role === 'vendor' && (
              <MobileLink href="/vendor/dashboard" onClick={closeMobile}>My Dashboard</MobileLink>
            )}
            {user?.role === 'admin' && (
              <MobileLink href="/admin" onClick={closeMobile}>Admin Panel</MobileLink>
            )}

            <div className="pt-3 border-t border-gray-100 mt-3 space-y-2">
              {user ? (
                <>
                  <MobileLink href={dashboardHref} onClick={closeMobile}>
                    {user.name}
                  </MobileLink>
                  <button
                    onClick={() => { closeMobile(); setShowLogoutConfirm(true); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <MobileLink href="/login"    onClick={closeMobile}>Login</MobileLink>
                  <MobileLink href="/register" onClick={closeMobile}>Get Started</MobileLink>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {children}
    </Link>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  );
}
