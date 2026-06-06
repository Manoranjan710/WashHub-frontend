'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface Review {
  id:           string;
  rating:       number;
  comment?:     string | null;
  vendor_reply?: string | null;
  created_at:   string;
  customer:     { name: string };
}

interface ReviewsResponse {
  reviews: Review[];
  total:   number;
  pages:   number;
  page:    number;
}

export default function ReviewsTab({ centerId }: { centerId: string }) {
  const [page,        setPage]        = useState(1);
  const [replyingId,  setReplyingId]  = useState<string | null>(null);
  const [replyText,   setReplyText]   = useState('');
  const [replyError,  setReplyError]  = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['vendor', 'reviews', centerId, page],
    queryFn: async () => {
      const { data } = await api.get(`/centers/${centerId}/reviews`, { params: { page } });
      return data.data;
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      api.patch(`/reviews/${reviewId}/reply`, { reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'reviews', centerId] });
      setReplyingId(null);
      setReplyText('');
      setReplyError(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setReplyError(msg ?? 'Failed to post reply. Try again.');
    },
  });

  function startReply(review: Review) {
    setReplyingId(review.id);
    setReplyText(review.vendor_reply ?? '');
    setReplyError(null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <span className="w-6 h-6 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
      </div>
    );
  }

  const reviews = data?.reviews ?? [];
  const total   = data?.total ?? 0;
  const pages   = data?.pages ?? 1;

  if (total === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">No reviews yet for this center.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{total} review{total !== 1 ? 's' : ''}</p>
      </div>

      {reviews.map(review => (
        <div key={review.id} className="border shadow-md border-gray-100 rounded-xl p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-800">{review.customer.name}</span>
              <StarRow rating={review.rating} />
            </div>
            <span className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
          )}

          {/* Existing reply */}
          {review.vendor_reply && replyingId !== review.id && (
            <div className="border-l-2 border-aqua-400 pl-3 bg-arctic-100/40 rounded-r py-2 pr-3">
              <p className="text-xs font-semibold text-deepsea-600 mb-1">Your reply</p>
              <p className="text-sm text-gray-600">{review.vendor_reply}</p>
            </div>
          )}

          {/* Reply editor */}
          {replyingId === review.id ? (
            <div className="space-y-2">
              {replyError && <p className="text-xs text-red-600">{replyError}</p>}
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply to this review…"
                rows={3}
                maxLength={2000}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-aqua-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setReplyingId(null); setReplyError(null); }}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => replyMutation.mutate({ reviewId: review.id, reply: replyText })}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="flex-1 bg-aqua-500 hover:bg-aqua-600 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                >
                  {replyMutation.isPending ? 'Posting…' : 'Post Reply'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => startReply(review)}
              className="text-xs text-aqua-600 hover:text-aqua-700 font-medium transition-colors"
            >
              {review.vendor_reply ? 'Edit reply' : '+ Reply'}
            </button>
          )}
        </div>
      ))}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">{page} / {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < filled ? '★' : '☆'}</span>
      ))}
    </span>
  );
}
