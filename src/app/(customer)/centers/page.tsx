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
      <section className="bg-deepsea-600 py-20 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">Find a Car Wash Near You</h1>
        <p className="mt-3 text-arctic-100/80 text-lg max-w-xl mx-auto px-4">
          Browse top-rated centers or share your location to see the nearest ones sorted by distance.
        </p>
      </section>

      {/* Listing with client-side geo-search */}
      <CentersListClient initialData={initialData} />
    </>
  );
}
