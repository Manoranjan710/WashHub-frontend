'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface MyBooking {
  id: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  price_paid: number;
  created_at: string;
  center:  { name: string; address: string };
  service: { name: string; duration_mins: number };
  slot:    { date: string; start_time: string };
  vehicle: { make: string; model: string; plate_number: string };
  review:  { id: string; rating: number } | null;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
  });
}

const STATUS_STYLE: Record<MyBooking['status'], string> = {
  confirmed:  'bg-aqua-100 text-aqua-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-gray-100 text-gray-500',
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function MyBookingsPage() {
  useAuthGuard('customer');

  const [bookings, setBookings]       = useState<MyBooking[]>([]);
  const [loading, setLoading]         = useState(true);
  const [cancelId, setCancelId]       = useState<string | null>(null);
  const [cancelling, setCancelling]   = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/bookings/my')
      .then(r => setBookings(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await api.patch(`/bookings/${cancelId}/cancel`);
      setBookings(prev =>
        prev.map(b => b.id === cancelId ? { ...b, status: 'cancelled' } : b)
      );
    } finally {
      setCancelling(false);
      setCancelId(null);
    }
  }

  function handleReviewSubmitted(bookingId: string, review: { id: string; rating: number }) {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, review } : b)
    );
    setReviewingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin inline-block" />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!cancelId}
        title="Cancel booking?"
        message="Are you sure you want to cancel this booking? This cannot be undone."
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, cancel'}
        cancelLabel="Keep booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-deepsea-600 py-10">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-3xl font-bold text-white">My Bookings</h1>
            <p className="text-arctic-100/70 text-sm mt-1">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10">
          {bookings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">You have no bookings yet.</p>
              <Link
                href="/centers"
                className="mt-5 inline-block bg-aqua-500 hover:bg-aqua-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Find a Car Wash
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isReviewing={reviewingId === booking.id}
                  onCancelClick={() => setCancelId(booking.id)}
                  onReviewClick={() => setReviewingId(booking.id)}
                  onReviewCancel={() => setReviewingId(null)}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── BookingCard ───────────────────────────────────────────────────────── */

function BookingCard({
  booking, isReviewing,
  onCancelClick, onReviewClick, onReviewCancel, onReviewSubmitted,
}: {
  booking: MyBooking;
  isReviewing: boolean;
  onCancelClick: () => void;
  onReviewClick: () => void;
  onReviewCancel: () => void;
  onReviewSubmitted: (id: string, review: { id: string; rating: number }) => void;
}) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div>
          <h3 className="font-semibold text-gray-800">{booking.center.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{booking.center.address}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <InfoCell label="Service"  value={`${booking.service.name} · ${booking.service.duration_mins} min`} />
        <InfoCell label="Date"     value={formatDate(booking.slot.date)} />
        <InfoCell label="Time"     value={formatTime(booking.slot.start_time)} />
        <InfoCell label="Vehicle"  value={`${booking.vehicle.make} ${booking.vehicle.model}`} sub={booking.vehicle.plate_number} />
      </div>

      {/* Price + actions */}
      <div className="px-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-deepsea-600 font-bold text-lg">
          ₹{Number(booking.price_paid).toLocaleString('en-IN')}
        </span>

        <div className="flex items-center gap-2">
          {booking.status === 'confirmed' && (
            <button
              onClick={onCancelClick}
              className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}

          {booking.status === 'completed' && !booking.review && !isReviewing && (
            <button
              onClick={onReviewClick}
              className="text-sm bg-aqua-500 hover:bg-aqua-600 text-white px-3 py-2 rounded-lg transition-colors"
            >
              Leave a Review
            </button>
          )}

          {booking.status === 'completed' && booking.review && (
            <span className="text-sm text-amber-500 font-medium">
              {'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)} Reviewed
            </span>
          )}
        </div>
      </div>

      {/* Inline review form */}
      {isReviewing && (
        <ReviewForm
          bookingId={booking.id}
          onCancel={onReviewCancel}
          onSubmitted={(review) => onReviewSubmitted(booking.id, review)}
        />
      )}
    </article>
  );
}

function InfoCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-gray-700 font-medium leading-snug">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/* ─── ReviewForm ────────────────────────────────────────────────────────── */

function ReviewForm({
  bookingId, onCancel, onSubmitted,
}: {
  bookingId: string;
  onCancel: () => void;
  onSubmitted: (review: { id: string; rating: number }) => void;
}) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit() {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/review`, {
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      onSubmitted({ id: data.data.id, rating: data.data.rating });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const display = hovered || rating;

  return (
    <div className="border-t border-gray-100 px-5 py-4 bg-arctic-100/30 space-y-3">
      <p className="text-sm font-semibold text-deepsea-600">Rate your experience</p>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Star picker */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            className={`text-2xl transition-colors ${n <= display ? 'text-amber-400' : 'text-gray-200'}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share details about your experience (optional)"
        maxLength={1000}
        rows={3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-aqua-300"
      />

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || rating === 0}
          className="flex-1 bg-aqua-500 hover:bg-aqua-600 disabled:opacity-50 text-white rounded-xl py-2 text-sm font-medium transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}
