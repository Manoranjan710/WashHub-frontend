'use client';

import { memo } from 'react';
import Link from 'next/link';
import { CenterSearchResult } from '@/types/center';
import { useAuthStore } from '@/store/authStore';

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className="text-amber-400 tracking-tight">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rounded ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

const CenterCard = memo(function CenterCard({ center }: { center: CenterSearchResult }) {
  const user = useAuthStore((s) => s.user);

  // Logged-out visitors can browse the list, but "View & Book" routes them to
  // login first (with a redirect back to the center they picked).
  const href = user
    ? `/centers/${center.id}`
    : `/login?redirect=/centers/${center.id}`;

  return (
    <article className="bg-white rounded-2xl border border-aqua-100/70 shadow-[0_4px_20px_rgba(0,95,115,0.09)] hover:shadow-[0_10px_36px_rgba(0,95,115,0.17)] hover:-translate-y-1 transition-all duration-200 flex flex-col">
      {/* Card header */}
      <div className="bg-deepsea-600 rounded-t-2xl px-5 pt-5 pb-4 border-b border-deepsea-500/20">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-lg leading-snug">{center.name}</h3>
          {center.distance_km != null && (
            <span className="shrink-0 bg-aqua-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              {center.distance_km} km
            </span>
          )}
        </div>
        <p className="text-arctic-100/80 text-sm mt-1 line-clamp-2">{center.address}</p>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex-1 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <StarRating rating={center.avg_rating} />
          <span className="text-sm text-gray-500">
            {Number(center.avg_rating).toFixed(1)}&nbsp;
            <span className="text-gray-400">
              ({center.total_reviews} {center.total_reviews === 1 ? 'review' : 'reviews'})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="text-aqua-500 font-bold text-base leading-none">&#10022;</span>
          <span>
            {center.service_count} {center.service_count === 1 ? 'service' : 'services'} available
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-5 pb-5">
        <Link
          href={href}
          className="block w-full text-center bg-aqua-500 hover:bg-aqua-600 active:scale-[0.98] text-white font-medium py-2.5 rounded-xl shadow-md hover:shadow-md transition-all duration-150 text-sm"
        >
          View &amp; Book
        </Link>
      </div>
    </article>
  );
});

export default CenterCard;
