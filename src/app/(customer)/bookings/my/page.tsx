'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface MyBooking {
  id: string;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  price_paid: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  refund_status: string | null;
  created_at: string;
  center:  { id: string; name: string; address: string };
  service: { name: string; duration_mins: number };
  slot:    { date: string; start_time: string };
  vehicle: { make: string; model: string; plate_number: string };
  review:  { id: string; rating: number } | null;
}

interface Slot {
  id: string;
  start_time: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
  is_past?: boolean;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
  });
}

const STATUS_STYLE: Record<MyBooking['status'], string> = {
  pending_payment: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-aqua-100 text-aqua-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show:   'bg-red-100 text-red-600',
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function MyBookingsPage() {
  useAuthGuard('customer');
  const { toastError } = useToast();

  const [bookings, setBookings]             = useState<MyBooking[]>([]);
  const [loading, setLoading]               = useState(true);
  const [cancelId, setCancelId]             = useState<string | null>(null);
  const [cancelling, setCancelling]         = useState(false);
  const [reviewingId, setReviewingId]       = useState<string | null>(null);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);

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
      setCancelId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError(msg ?? 'Failed to cancel booking.');
      setCancelId(null);
    } finally {
      setCancelling(false);
    }
  }

  function handleReviewSubmitted(bookingId: string, review: { id: string; rating: number }) {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, review } : b)
    );
    setReviewingId(null);
  }

  function handleRescheduled(bookingId: string, newSlot: { date: string; start_time: string }) {
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, slot: newSlot } : b)
    );
    setReschedulingId(null);
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
        message="Are you sure you want to cancel this booking? If paid, a full refund will be issued automatically. This cannot be undone."
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, cancel'}
        cancelLabel="Keep booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-deepsea-600 py-10">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">My Bookings</h1>
              <p className="text-arctic-100/70 text-sm mt-1">
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
              </p>
            </div>
            <Link
              href="/vehicles"
              className="text-sm text-arctic-100/70 hover:text-white border border-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              My Vehicles
            </Link>
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
                  isRescheduling={reschedulingId === booking.id}
                  onCancelClick={() => setCancelId(booking.id)}
                  onReviewClick={() => setReviewingId(booking.id)}
                  onReviewCancel={() => setReviewingId(null)}
                  onReviewSubmitted={handleReviewSubmitted}
                  onRescheduleClick={() => setReschedulingId(booking.id)}
                  onRescheduleCancel={() => setReschedulingId(null)}
                  onRescheduled={handleRescheduled}
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
  booking, isReviewing, isRescheduling,
  onCancelClick, onReviewClick, onReviewCancel, onReviewSubmitted,
  onRescheduleClick, onRescheduleCancel, onRescheduled,
}: {
  booking: MyBooking;
  isReviewing: boolean;
  isRescheduling: boolean;
  onCancelClick: () => void;
  onReviewClick: () => void;
  onReviewCancel: () => void;
  onReviewSubmitted: (id: string, review: { id: string; rating: number }) => void;
  onRescheduleClick: () => void;
  onRescheduleCancel: () => void;
  onRescheduled: (id: string, slot: { date: string; start_time: string }) => void;
}) {
  const refunded = booking.payment_status === 'refunded' && booking.refund_status === 'processed';

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div>
          <h3 className="font-semibold text-gray-800">{booking.center.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{booking.center.address}</p>
        </div>
        <div className="flex items-center gap-2">
          {refunded && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
              Refunded
            </span>
          )}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[booking.status]}`}>
            {booking.status.replace('_', ' ')}
          </span>
        </div>
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

        <div className="flex items-center gap-2 flex-wrap">
          {booking.status === 'pending_payment' && (
            <>
              <Link
                href={`/payment/${booking.id}`}
                className="text-sm bg-deepsea-600 hover:bg-deepsea-700 text-white px-3 py-2 rounded-lg transition-colors"
              >
                Complete Payment
              </Link>
              <button
                onClick={onCancelClick}
                className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <>
              <button
                onClick={onRescheduleClick}
                className="text-sm border border-aqua-200 text-aqua-600 hover:bg-aqua-50 px-3 py-2 rounded-lg transition-colors"
              >
                Reschedule
              </button>
              <button
                onClick={onCancelClick}
                className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
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

      {/* Inline reschedule panel */}
      {isRescheduling && (
        <ReschedulePanel
          bookingId={booking.id}
          centerId={booking.center.id}
          onCancel={onRescheduleCancel}
          onRescheduled={(slot) => onRescheduled(booking.id, slot)}
        />
      )}

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

/* ─── ReschedulePanel ───────────────────────────────────────────────────── */

function ReschedulePanel({
  bookingId, centerId, onCancel, onRescheduled,
}: {
  bookingId: string;
  centerId: string;
  onCancel: () => void;
  onRescheduled: (slot: { date: string; start_time: string }) => void;
}) {
  const { toastError } = useToast();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [date, setDate]                 = useState('');
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  async function loadSlots(d: string) {
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    try {
      const { data } = await api.get(`/centers/${centerId}/slots`, { params: { date: d } });
      setSlots(data.data ?? []);
    } catch {
      toastError('Failed to load slots. Try again.');
    } finally {
      setSlotsLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const { data } = await api.patch(`/bookings/${bookingId}/reschedule`, {
        new_slot_id: selectedSlot.id,
      });
      onRescheduled({
        date:       data.data.slot.date,
        start_time: data.data.slot.start_time,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError(msg ?? 'Reschedule failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-gray-100 px-5 py-5 bg-arctic-100/20 space-y-4">
      <p className="text-sm font-semibold text-deepsea-600">Choose a new date &amp; time</p>

      {/* Date picker */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">New date</label>
          <input
            type="date"
            min={today}
            value={date}
            onChange={e => { setDate(e.target.value); loadSlots(e.target.value); }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-aqua-300"
          />
        </div>
      </div>

      {/* Slot grid */}
      {date && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Available slots</p>
          {slotsLoading ? (
            <div className="flex justify-center py-4">
              <span className="w-5 h-5 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No available slots on this date.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.filter(s => s.is_available).map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border py-2.5 text-xs font-medium transition-all
                    ${selectedSlot?.id === slot.id
                      ? 'border-aqua-500 bg-aqua-500 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-aqua-300'
                    }`}
                >
                  {formatTime(slot.start_time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedSlot || submitting}
          className="flex-1 bg-aqua-500 hover:bg-aqua-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          {submitting ? 'Rescheduling…' : 'Confirm Reschedule'}
        </button>
      </div>
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
  const { toastError } = useToast();
  const [rating, setRating]         = useState(0);
  const [hovered, setHovered]       = useState(0);
  const [comment, setComment]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) { toastError('Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/bookings/${bookingId}/review`, {
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      onSubmitted({ id: data.data.id, rating: data.data.rating });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toastError(msg ?? 'Failed to submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const display = hovered || rating;

  return (
    <div className="border-t border-gray-100 px-5 py-4 bg-arctic-100/30 space-y-3">
      <p className="text-sm font-semibold text-deepsea-600">Rate your experience</p>

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
