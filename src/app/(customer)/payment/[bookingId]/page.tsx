'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { useAuthGuard } from '@/hooks/useAuthGuard';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface BookingDetail {
  id:         string;
  status:     string;
  price_paid: string;
  payment_status: string;
  center:   { name: string; address: string };
  service:  { name: string; duration_mins: number };
  slot:     { date: string; start_time: string };
  vehicle:  { make: string; model: string; plate_number: string };
}

interface RazorpayOrder {
  order_id:   string;
  amount:     number;
  currency:   string;
  key:        string;
  booking_id: string;
}

// Razorpay global injected by the script tag
declare global {
  interface Window {
    Razorpay: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key:         string;
  amount:      number;
  currency:    string;
  order_id:    string;
  name:        string;
  description: string;
  handler:     (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal:       { ondismiss: () => void };
  theme:       { color: string };
}

interface RazorpayInstance {
  open: () => void;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id  = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function PaymentPage({ params }: { params: { bookingId: string } }) {
  useAuthGuard('customer');
  const router   = useRouter();
  const { bookingId } = params;

  const [booking,  setBooking]  = useState<BookingDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(r => setBooking(r.data.data))
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePay = useCallback(async () => {
    if (!booking) return;
    setPaying(true);
    setError(null);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError('Failed to load payment gateway. Check your connection and try again.');
        return;
      }

      const { data } = await api.post<{ data: RazorpayOrder }>(`/bookings/${bookingId}/payment/order`);
      const order = data.data;

      const rzp = new window.Razorpay({
        key:         order.key,
        amount:      order.amount,
        currency:    order.currency,
        order_id:    order.order_id,
        name:        'WashHub',
        description: booking.service.name,
        handler: async (response) => {
          try {
            await api.post(`/bookings/${bookingId}/payment/verify`, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            router.push(`/payment/success?bookingId=${bookingId}`);
          } catch {
            router.push(`/payment/failure?bookingId=${bookingId}`);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: { color: '#0ea5b0' },
      });

      rzp.open();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not initiate payment. Please try again.');
      setPaying(false);
    }
  }, [booking, bookingId, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600">{error}</p>
        <Link href="/bookings/my" className="text-aqua-500 underline text-sm">View My Bookings</Link>
      </div>
    );
  }

  if (!booking) return null;

  // Already paid — redirect away
  if (booking.status === 'confirmed' || booking.payment_status === 'paid') {
    router.replace('/bookings/my');
    return null;
  }

  // Expired / cancelled
  if (booking.status === 'cancelled') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-gray-600">This booking has expired. Please create a new booking.</p>
        <Link href="/centers" className="text-aqua-500 underline text-sm">Find a Center</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-deepsea-600 py-10">
        <div className="max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-white">Complete Payment</h1>
          <p className="text-arctic-100/70 text-sm mt-1">Secure checkout powered by Razorpay</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-4">
        {/* Booking summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-deepsea-600">Booking Summary</p>
          </div>
          <div className="divide-y divide-gray-50">
            <SummaryRow label="Center"  value={booking.center.name} />
            <SummaryRow label="Service" value={`${booking.service.name} · ${booking.service.duration_mins} min`} />
            <SummaryRow label="Date"    value={formatDate(booking.slot.date)} />
            <SummaryRow label="Time"    value={formatTime(booking.slot.start_time)} />
            <SummaryRow label="Vehicle" value={`${booking.vehicle.make} ${booking.vehicle.model} · ${booking.vehicle.plate_number}`} />
          </div>
          <div className="px-5 py-4 bg-deepsea-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-deepsea-700">Total Amount</span>
            <span className="text-lg font-bold text-deepsea-700">
              ₹{Number(booking.price_paid).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* 15-min notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Complete payment within 15 minutes — your slot will be released after that.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-deepsea-600 hover:bg-deepsea-700 disabled:opacity-60 text-white font-semibold py-4 rounded-xl transition-colors text-sm"
        >
          {paying ? 'Opening payment…' : `Pay ₹${Number(booking.price_paid).toLocaleString('en-IN')}`}
        </button>

        <Link
          href="/bookings/my"
          className="block w-full text-center border border-gray-200 text-gray-500 hover:bg-gray-50 py-3 rounded-xl text-sm transition-colors"
        >
          Cancel and go back
        </Link>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}
