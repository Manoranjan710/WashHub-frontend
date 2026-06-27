import { Suspense } from 'react';
import Image from 'next/image';
import CentersListClient from '@/components/centers/CentersListClient';

// SSR: listing is personalised by geo + pagination; no caching at the page level.
export const dynamic = 'force-dynamic';

interface PageData {
  centers: import('@/types/center').CenterSearchResult[];
  hasMore: boolean;
  page: number;
}

async function getDefaultCenters(): Promise<PageData> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/centers?page=1`, {
      cache: 'no-store',
    });
    if (!res.ok) return { centers: [], hasMore: false, page: 1 };
    const json = await res.json();
    return json.data ?? { centers: [], hasMore: false, page: 1 };
  } catch {
    return { centers: [], hasMore: false, page: 1 };
  }
}

async function CentersData() {
  const initialData = await getDefaultCenters();
  return (
    <div className="centers-bg">
      <CentersListClient initialData={initialData} />
    </div>
  );
}

function CentersSkeleton() {
  return (
    <div className="centers-bg">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">
        <div className="h-16 bg-deepsea-600/10 rounded-2xl mb-4 animate-pulse" />
        <div className="h-14 bg-gray-100 rounded-2xl mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-aqua-100/70 overflow-hidden animate-pulse">
              <div className="bg-deepsea-600/20 h-24 rounded-t-2xl" />
              <div className="px-5 py-4 space-y-3">
                <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                <div className="h-3 bg-gray-100 rounded-full w-1/2" />
              </div>
              <div className="px-5 pb-5">
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function CentersPage() {
  return (
    <>
      {/* Hero — ships immediately, no data dependency */}
      <section className="relative pt-24 pb-20 text-center overflow-hidden">
        <Image
          src="/car_wash.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          quality={60}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-deepsea-600/70" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
            Find a Car Wash Near You
          </h1>
          <p className="mt-3 text-arctic-100/90 text-lg max-w-xl mx-auto px-4">
            Browse top-rated centers or share your location to see the nearest ones sorted by distance.
          </p>
        </div>
      </section>

      {/* Listing streams in once the API responds */}
      <Suspense fallback={<CentersSkeleton />}>
        <CentersData />
      </Suspense>
    </>
  );
}
