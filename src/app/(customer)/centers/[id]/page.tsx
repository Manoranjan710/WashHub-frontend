import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { CenterDetail, Review, Service } from '@/types/center';

// ISR — revalidate every 60 s. Services and ratings change infrequently;
// the 60-second window is a good trade-off between freshness and caching.
export const revalidate = 60;

// CenterMap uses Leaflet which requires the browser window object → ssr: false
const CenterMap = dynamic(() => import('@/components/centers/CenterMap'), { ssr: false });

async function getCenter(id: string): Promise<CenterDetail | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/centers/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const center = await getCenter(params.id);
  if (!center) return { title: 'Center Not Found — WashHub' };
  return {
    title: `${center.name} — WashHub`,
    description: `Book a car wash at ${center.name}. ${center.total_reviews} reviews · ${center.services.length} services available.`,
  };
}

export default async function CenterDetailPage({ params }: { params: { id: string } }) {
  const center = await getCenter(params.id);
  if (!center) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-deepsea-600 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/centers"
            className="inline-flex items-center gap-1.5 text-arctic-100/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <BackIcon /> Find Centers
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            {center.name}
          </h1>
          <p className="mt-2 text-arctic-100/80 text-base">{center.address}</p>

          <div className="flex items-center gap-3 mt-4">
            <StarRow rating={center.avg_rating} />
            <span className="text-white font-semibold">{Number(center.avg_rating).toFixed(1)}</span>
            <span className="text-arctic-100/60 text-sm">
              ({center.total_reviews} {center.total_reviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Map */}
        <section>
          <h2 className="text-xl font-semibold text-deepsea-600 mb-4">Location</h2>
          <CenterMap
            lat={Number(center.latitude)}
            lng={Number(center.longitude)}
            name={center.name}
          />
        </section>

        {/* Services */}
        <ServicesSection centerId={center.id} services={center.services} />

        {/* Reviews */}
        <ReviewsSection reviews={center.reviews} total={center.total_reviews} />
      </div>
    </div>
  );
}

/* ─── Services ─────────────────────────────────────────────────────────────── */

function ServicesSection({ centerId, services }: { centerId: string; services: Service[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-deepsea-600 mb-5">Services</h2>

      {services.length === 0 ? (
        <p className="text-gray-400">No services listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-800">{svc.name}</h3>
                <span className="shrink-0 text-aqua-500 font-bold text-lg">
                  ₹{Number(svc.price).toLocaleString('en-IN')}
                </span>
              </div>

              {svc.description && (
                <p className="text-gray-500 text-sm">{svc.description}</p>
              )}

              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                  {svc.duration_mins} min
                </span>
                <Link
                  href={`/centers/${centerId}/book?serviceId=${svc.id}`}
                  className="bg-aqua-500 hover:bg-aqua-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Reviews ───────────────────────────────────────────────────────────────── */

function ReviewsSection({ reviews, total }: { reviews: Review[]; total: number }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-xl font-semibold text-deepsea-600">Customer Reviews</h2>
        <span className="text-sm text-gray-400">{total} total</span>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-400">No reviews yet. Be the first to leave one after your visit!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{review.customer.name}</span>
          <StarRow rating={review.rating} small />
        </div>
        <span className="text-xs text-gray-400">{date}</span>
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

/* ─── Shared sub-components ─────────────────────────────────────────────────── */

function StarRow({ rating, small }: { rating: number; small?: boolean }) {
  const filled = Math.round(rating);
  return (
    <span className={`text-amber-400 tracking-tight ${small ? 'text-sm' : 'text-base'}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < filled ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
