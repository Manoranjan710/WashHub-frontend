import CentersListClient from '@/components/centers/CentersListClient';
import { CenterSearchResult } from '@/types/center';

// ISR: regenerate at most once per minute. The default listing (sorted by
// rating, no location) is identical for every visitor, so static generation
// with periodic revalidation gives fast loads without stale data for long.
export const revalidate = 60;

async function getDefaultCenters(): Promise<CenterSearchResult[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/centers`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function CentersPage() {
  const initialCenters = await getDefaultCenters();

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
      <CentersListClient initialCenters={initialCenters} />
    </>
  );
}
