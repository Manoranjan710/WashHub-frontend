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

interface AiFilters {
  textFilter?: string;
  sortBy?:     'rating' | 'distance';
  minRating?:  number;
  radius?:     number;
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
  const [minRating, setMinRating]   = useState(0);
  const [sort, setSort]             = useState<'rating' | 'distance'>('rating');

  // AI search state
  const [aiQuery, setAiQuery]       = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState<string | null>(null);
  const [aiFiltersActive, setAiFiltersActive] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const isDefaultQuery = coords === null && radius === 2;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
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

    if (minRating > 0) {
      result = result.filter(c => c.avg_rating >= minRating);
    }

    if (sort === 'rating') {
      result = [...result].sort((a, b) => b.avg_rating - a.avg_rating);
    }

    return result;
  }, [allCenters, textFilter, minRating, sort]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { rootMargin: '200px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setTextFilter(e.target.value),
    [],
  );

  const handleRadiusChange = useCallback((r: number) => setRadius(r), []);

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

  const handleAiSearch = useCallback(async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const { data } = await api.post('/ai/search', { query: aiQuery.trim() });
      const filters = data.data as AiFilters;

      if (filters.textFilter) setTextFilter(filters.textFilter);
      if (filters.sortBy)     setSort(filters.sortBy);
      if (filters.minRating)  setMinRating(filters.minRating);
      if (filters.radius)     setRadius(Math.min(filters.radius, 10));

      // If AI suggests distance sort but geo isn't active, request location
      if (filters.sortBy === 'distance' && !coords) handleGeoSearch();

      setAiFiltersActive(true);
    } catch {
      setAiError('AI search failed. Please try the filters manually.');
    } finally {
      setAiLoading(false);
    }
  }, [aiQuery, coords, handleGeoSearch]);

  const handleClearAiFilters = useCallback(() => {
    setTextFilter('');
    setMinRating(0);
    setSort('rating');
    setAiQuery('');
    setAiFiltersActive(false);
    setAiError(null);
  }, []);

  const geoActive = coords !== null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-[60vh]">

      {/* AI Search bar */}
      <div className="bg-gradient-to-r from-deepsea-600 to-aqua-600 rounded-2xl shadow-lg px-5 py-4 mb-4">
        <p className="text-white/80 text-xs font-medium uppercase tracking-widest mb-2 flex items-center gap-1">
          <SparkleIcon /> AI Smart Search
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiQuery}
            onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAiSearch(); }}
            placeholder='Try: "foam wash near me" or "best rated interior cleaning"'
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 shadow-inner"
          />
          <button
            onClick={handleAiSearch}
            disabled={aiLoading || !aiQuery.trim()}
            className="flex items-center justify-center gap-2 shrink-0 whitespace-nowrap bg-white text-deepsea-700 font-semibold px-4 sm:px-5 py-2.5 rounded-lg text-sm shadow hover:bg-arctic-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {aiLoading
              ? <><span className="w-4 h-4 border-2 border-deepsea-200 border-t-deepsea-600 rounded-full animate-spin inline-block" /> Thinking…</>
              : <><SparkleIcon /> Search</>
            }
          </button>
        </div>
        {aiError && <p className="text-red-200 text-xs mt-2">{aiError}</p>}

        {aiFiltersActive && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-white/90 text-xs">Filters applied:</span>
            {textFilter && <Chip label={`"${textFilter}"`} />}
            {minRating > 0 && <Chip label={`${minRating}★ & above`} />}
            {sort === 'distance' && <Chip label="Nearest first" />}
            <button
              onClick={handleClearAiFilters}
              className="text-white/70 hover:text-white text-xs underline underline-offset-2 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Manual filter bar */}
      <div className="bg-white rounded-2xl border border-aqua-100/60 shadow-[0_2px_16px_rgba(0,95,115,0.07)] px-5 py-4 mb-8 flex flex-wrap items-center gap-3">
        {/* Text search */}
        <input
          type="search"
          placeholder="Search centers…"
          value={textFilter}
          onChange={handleTextChange}
          className="border border-aqua-100 rounded-lg px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-aqua-300 focus:border-aqua-300 transition-shadow w-48"
        />

        {/* Min rating */}
        <select
          value={minRating}
          onChange={e => setMinRating(Number(e.target.value))}
          className="border border-aqua-100 rounded-lg px-3 py-2 text-sm text-deepsea-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-aqua-300"
        >
          <option value={0}>Any rating</option>
          <option value={3}>3★ & above</option>
          <option value={4}>4★ & above</option>
          <option value={4.5}>4.5★ & above</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value as 'rating' | 'distance')}
          className="border border-aqua-100 rounded-lg px-3 py-2 text-sm text-deepsea-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-aqua-300"
        >
          <option value="rating">Sort: Top rated</option>
          <option value="distance" disabled={!geoActive}>Sort: Nearest first</option>
        </select>

        {/* Radius + geo */}
        <div className="flex items-center rounded-lg border border-aqua-300 overflow-hidden bg-white shadow-sm">
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
            className="flex items-center gap-2 bg-aqua-500 hover:bg-aqua-600 active:bg-aqua-700 disabled:opacity-60 text-white px-4 py-2 text-sm font-medium transition-colors"
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
        <p className="text-sm text-deepsea-600 font-medium mb-6 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-aqua-500 shadow-[0_0_0_3px_rgba(0,180,204,0.2)]" />
          {displayed.length} {displayed.length === 1 ? 'center' : 'centers'} within {radius} km of your location
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => <CenterCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Failed to load centers.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-sm text-aqua-600 underline underline-offset-2 hover:text-aqua-700"
          >
            Try again
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No centers found{textFilter ? ` matching "${textFilter}"` : geoActive ? ' near your location' : ''}.</p>
          {(textFilter || minRating > 0) && (
            <button
              onClick={() => { setTextFilter(''); setMinRating(0); }}
              className="mt-4 text-sm text-aqua-600 underline underline-offset-2 hover:text-aqua-700"
            >
              Clear filters
            </button>
          )}
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

function CenterCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-aqua-100/70 overflow-hidden animate-pulse">
      <div className="bg-gray-200 h-24 rounded-t-2xl" />
      <div className="px-5 py-4 space-y-3">
        <div className="h-3 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="h-3 bg-gray-100 rounded-full w-2/3" />
      </div>
      <div className="px-5 pb-5">
        <div className="h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
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

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
      {label}
    </span>
  );
}
