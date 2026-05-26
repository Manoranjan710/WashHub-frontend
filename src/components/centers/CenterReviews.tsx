'use client';

import { useState } from 'react';
import { api } from '@/lib/axios';
import { Review } from '@/types/center';

interface ReviewsData {
  reviews: Review[];
  total:   number;
  pages:   number;
}

interface Props {
  centerId:     string;
  initialData:  ReviewsData;
}

export default function CenterReviews({ centerId, initialData }: Props) {
  const [reviews,  setReviews]  = useState<Review[]>(initialData.reviews);
  const [total,    setTotal]    = useState(initialData.total);
  const [pages,    setPages]    = useState(initialData.pages);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const next = page + 1;
      const { data } = await api.get(`/centers/${centerId}/reviews`, { params: { page: next } });
      setReviews(prev => [...prev, ...(data.data.reviews ?? [])]);
      setTotal(data.data.total);
      setPages(data.data.pages);
      setPage(next);
    } finally {
      setLoading(false);
    }
  }

  if (total === 0) {
    return (
      <p className="text-gray-400">No reviews yet. Be the first to leave one after your visit!</p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {page < pages && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full border border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : `Load more reviews (${total - reviews.length} remaining)`}
        </button>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const filled = Math.round(review.rating);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{review.customer.name}</span>
          <span className="text-amber-400 text-sm tracking-tight">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}>{i < filled ? '★' : '☆'}</span>
            ))}
          </span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </div>

      {review.comment && (
        <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
      )}

      {review.vendor_reply && (
        <div className="border-l-2 border-aqua-400 pl-3 bg-arctic-100/40 rounded-r-lg py-2 pr-3">
          <p className="text-xs font-semibold text-deepsea-600 mb-1">Response from owner</p>
          <p className="text-sm text-gray-600">{review.vendor_reply}</p>
        </div>
      )}
    </div>
  );
}
