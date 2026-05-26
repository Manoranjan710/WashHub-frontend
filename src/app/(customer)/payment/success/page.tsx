'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-deepsea-600 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">Payment Successful!</h1>
          <p className="text-arctic-100/70 text-sm mt-1">Your booking is confirmed</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 text-center">
            A confirmation email has been sent to your registered email address.
          </p>

          {bookingId && (
            <p className="text-xs text-gray-400 text-center font-mono">
              Booking ID: {bookingId}
            </p>
          )}

          <Link
            href="/bookings/my"
            className="block w-full text-center bg-aqua-500 hover:bg-aqua-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            View My Bookings
          </Link>
          <Link
            href="/centers"
            className="block w-full text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm transition-colors"
          >
            Book Another Wash
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
