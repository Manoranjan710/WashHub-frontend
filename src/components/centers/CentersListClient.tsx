'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { CenterSearchResult } from '@/types/center';
import CenterCard from './CenterCard';

interface PageData {
  centers: CenterSearchResult[];
  hasMore: boolean;
  page: number;
}

interface Props {
  initialData: PageData;
}

async function fetchCenters(
  page: number,
  coords: { lat: number; lng: number } | null,
  radius: number,
): Promise<PageData> {
  const params: Record<string, string | number> = { page, radius };
  if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
  const { data } = await api.get('/centers', { params });
  return data.data as PageData;
}

export default function CentersListClient({ initialData }: Props) {
  const [coords, setCoords]         = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius]         = useState(2);
  const [geoError, setGeoError]     = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [textFilter, setTextFilter] = useState('');
  const [sort, setSort]             = useState<'rating' | 'distance'>('rating');
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Only hydrate with SSR data for the initial no-geo, default-radius query.
  // For any geo query the initialData would be unfiltered SSR data which would
  // appear fresh (staleTime) and never trigger a refetch — showing wrong results.
  const isDefaultQuery = coords === null && radius === 2;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PageData>({
    queryKey:  ['centers', coords, radius],
    queryFn:   ({ pageParam }) => fetchCenters(pageParam as number, coords, radius),
    getNextPageParam: (last) => last.hasMore ? last.page + 1 : undefined,
    initialPageParam: 1,
    ...(isDefaultQuery
      ? { initialData: { pages: [initialData], pageParams: [1] }, staleTime: 5 * 60 * 1000 }
      : { staleTime: 0 }
    ),
  });

  // Flatten all pages, apply text filter + sort with useMemo
  const allCenters = useMemo(
    () => data?.pages.flatMap(p => p.centers) ?? [],
    [data],
  );

  const displayed = useMemo(() => {
    let result = allCenters;
    if (textFilter.trim()) {
      const q = textFilter.toLowerCase();
      result = result.filter(
        c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q),
      );
    }
    if (sort === 'rating') {
      result = [...result].sort((a, b) => b.avg_rating - a.avg_rating);
    }
    // 'distance' order is the natural API order when geo is active
    return result;
  }, [allCenters, textFilter, sort]);

  // Infinite scroll sentinel — trigger fetchNextPage when visible
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // useCallback handlers
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setTextFilter(e.target.value),
    [],
  );

  const handleRadiusChange = useCallback((r: number) => {
    setRadius(r);
    // If geo is already active, the query key updates automatically and refetches
  }, []);

  const handleGeoSearch = useCallback(async () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported.'); return; }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort('distance');
        setGeoLoading(false);
      },
      () => {
        setGeoError('Location access denied. Please allow access and try again.');
        setGeoLoading(false);
      },
    );
  }, []);

  const handleClearGeo = useCallback(() => {
    setCoords(null);
    setSort('rating');
    setGeoError(null);
  }, []);

  const geoActive = coords !== null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Text search */}
        <input
          type="search"
          placeholder="Search centers…"
          value={textFilter}
          onChange={handleTextChange}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-aqua-300 w-48"
        />

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'rating' | 'distance')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-deepsea-600 bg-white focus:outline-none focus:ring-2 focus:ring-aqua-300"
        >
          <option value="rating">Sort: Top rated</option>
          <option value="distance" disabled={!geoActive}>Sort: Nearest first</option>
        </select>

        {/* Radius + geo button grouped */}
        <div className="flex items-center rounded-lg border border-aqua-300 overflow-hidden bg-white">
          <select
            value={radius}
            onChange={e => handleRadiusChange(Number(e.target.value))}
            disabled={!geoActive || geoLoading}
            title={!geoActive ? 'Enable location first to filter by radius' : undefined}
            className="px-3 py-2 text-sm text-deepsea-600 bg-transparent focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed border-r border-aqua-300"
          >
            {[2, 5, 7, 10].map(r => (
              <option key={r} value={r}>Within {r} km</option>
            ))}
          </select>

          <button
            onClick={handleGeoSearch}
            disabled={geoLoading}
            className="flex items-center gap-2 bg-aqua-500 hover:bg-aqua-600 disabled:opacity-60 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            {geoLoading
              ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Searching…</>
              : <><LocationIcon /> Use my location</>
            }
          </button>
        </div>

        {geoActive && (
          <button onClick={handleClearGeo} className="text-sm text-deepsea-600 underline underline-offset-2 hover:text-aqua-600 transition-colors">
            Clear location
          </button>
        )}
      </div>

      {geoError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">{geoError}</p>
      )}

      {geoActive && (
        <p className="text-sm text-deepsea-600 font-medium mb-6">
          {displayed.length} {displayed.length === 1 ? 'center' : 'centers'} within {radius} km of your location
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <span className="w-8 h-8 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin inline-block" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No centers found{textFilter ? ` matching "${textFilter}"` : geoActive ? ' near your location' : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map(center => <CenterCard key={center.id} center={center} />)}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-6 flex justify-center">
        {isFetchingNextPage && (
          <span className="w-6 h-6 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin inline-block" />
        )}
        {!hasNextPage && allCenters.length > 0 && !textFilter && (
          <p className="text-xs text-gray-400">All centers loaded</p>
        )}
      </div>
    </section>
  );
}

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}
