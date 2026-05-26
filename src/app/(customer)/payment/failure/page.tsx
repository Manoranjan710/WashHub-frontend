'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailureContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-red-500 py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold">Payment Failed</h1>
          <p className="text-white/70 text-sm mt-1">Your slot is still reserved for 15 minutes</p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Something went wrong during payment. You can retry or cancel the booking.
          </p>

          {bookingId && (
            <Link
              href={`/payment/${bookingId}`}
              className="block w-full text-center bg-deepsea-600 hover:bg-deepsea-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Try Again
            </Link>
          )}
          <Link
            href="/bookings/my"
            className="block w-full text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm transition-colors"
          >
            View My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense>
      <FailureContent />
    </Suspense>
  );
}
