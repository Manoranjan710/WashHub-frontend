import Link from 'next/link';
import { CenterSearchResult } from '@/types/center';

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

export default function CenterCard({ center }: { center: CenterSearchResult }) {
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
      {/* Card header */}
      <div className="bg-deepsea-600 rounded-t-2xl px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-lg leading-snug">{center.name}</h3>
          {center.distance_km != null && (
            <span className="shrink-0 bg-aqua-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
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
          href={`/centers/${center.id}`}
          className="block w-full text-center bg-aqua-500 hover:bg-aqua-600 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          View &amp; Book
        </Link>
      </div>
    </article>
  );
}
