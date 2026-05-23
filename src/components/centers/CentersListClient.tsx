'use client';

import { useState } from 'react';
import { api } from '@/lib/axios';
import { CenterSearchResult } from '@/types/center';
import CenterCard from './CenterCard';

interface Props {
  initialCenters: CenterSearchResult[];
}

export default function CentersListClient({ initialCenters }: Props) {
  const [centers, setCenters]   = useState<CenterSearchResult[]>(initialCenters);
  const [radius, setRadius]     = useState(10);
  const [loading, setLoading]   = useState(false);
  const [geoActive, setGeoActive] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleGeoSearch() {
    if (!navigator.geolocation) {
      setError('Your browser does not support geolocation.');
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await api.get('/centers', {
            params: {
              lat:    pos.coords.latitude,
              lng:    pos.coords.longitude,
              radius,
            },
          });
          setCenters(data.data ?? []);
          setGeoActive(true);
        } catch {
          setError('Search failed. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access was denied. Please allow location access and try again.');
        setLoading(false);
      },
    );
  }

  function handleClear() {
    setCenters(initialCenters);
    setGeoActive(false);
    setError(null);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          disabled={loading}
          className="border border-aqua-300 rounded-lg px-3 py-2 text-sm text-deepsea-600 bg-white focus:outline-none focus:ring-2 focus:ring-aqua-400 disabled:opacity-50"
        >
          {[5, 10, 20, 50].map((r) => (
            <option key={r} value={r}>Within {r} km</option>
          ))}
        </select>

        <button
          onClick={handleGeoSearch}
          disabled={loading}
          className="flex items-center gap-2 bg-aqua-500 hover:bg-aqua-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Searching…
            </>
          ) : (
            <>
              <LocationIcon />
              Use my location
            </>
          )}
        </button>

        {geoActive && !loading && (
          <button
            onClick={handleClear}
            className="text-sm text-deepsea-600 underline underline-offset-2 hover:text-aqua-600 transition-colors"
          >
            Clear location filter
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {geoActive && !loading && (
        <p className="text-sm text-deepsea-600 mb-6 font-medium">
          Showing {centers.length} {centers.length === 1 ? 'center' : 'centers'} within {radius} km of your location
        </p>
      )}

      {centers.length === 0 && !loading ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No car wash centers found{geoActive ? ' near your location' : ''}.</p>
          {geoActive && (
            <p className="text-gray-400 text-sm mt-2">Try increasing the radius or clear the filter to see all centers.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {centers.map((center) => (
            <CenterCard key={center.id} center={center} />
          ))}
        </div>
      )}
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
