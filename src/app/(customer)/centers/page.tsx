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

export default async function CentersPage() {
  const initialData = await getDefaultCenters();

  return (
    <>
      {/* Hero */}
      <section
        className="relative pt-24 pb-20 text-center bg-cover bg-center"
        style={{ backgroundImage: "url('/car_wash.jpg')" }}
      >
        {/* Dark teal overlay for text legibility */}
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

      {/* Listing with client-side geo-search */}
      <div className="centers-bg">
        <CentersListClient initialData={initialData} />
      </div>
    </>
  );
}
