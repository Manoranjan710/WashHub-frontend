'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';
import { Center, Service } from '@/types/center';
import ServicesTab from '@/components/vendor/ServicesTab';
import SlotsTab from '@/components/vendor/SlotsTab';
import BookingsTab from '@/components/vendor/BookingsTab';
import ReviewsTab from '@/components/vendor/ReviewsTab';
import AnalyticsTab from '@/components/vendor/AnalyticsTab';
import AIInsightsTab from '@/components/vendor/AIInsightsTab';

type CenterWithServices = Center & { services: Service[] };
type TabId = 'services' | 'slots' | 'bookings' | 'reviews' | 'analytics' | 'ai-insights';

const TABS: { id: TabId; label: string }[] = [
  { id: 'services',    label: 'Services'    },
  { id: 'slots',       label: 'Slots'       },
  { id: 'bookings',    label: 'Bookings'    },
  { id: 'reviews',     label: 'Reviews'     },
  { id: 'analytics',   label: 'Analytics'   },
  { id: 'ai-insights', label: '✦ AI Insights' },
];

const STATUS_STYLES: Record<string, { badge: string; label: string; hint: string }> = {
  pending:   { badge: 'bg-yellow-100 text-yellow-800', label: 'Pending Review',  hint: 'Our team is reviewing your center. You\'ll be notified once approved.' },
  active:    { badge: 'bg-green-100 text-green-800',   label: 'Active',          hint: 'Your center is live and visible to customers.' },
  rejected:  { badge: 'bg-red-100 text-red-800',       label: 'Rejected',        hint: 'Your registration was rejected. Contact support for details.' },
  suspended: { badge: 'bg-gray-100 text-gray-700',     label: 'Suspended',       hint: 'Your center has been suspended. Contact support.' },
};

async function fetchMyCenters(): Promise<CenterWithServices[]> {
  const { data } = await api.get<ApiSuccess<CenterWithServices[]>>('/centers/my');
  return data.data;
}

export default function VendorDashboardPage() {
  const { user, isReady } = useAuthGuard('vendor');

  const { data: centers = [], isLoading, refetch } = useQuery({
    queryKey: ['vendor', 'centers'],
    queryFn: fetchMyCenters,
    enabled: isReady,
  });

  // Track active tab per center
  const [activeTabs, setActiveTabs] = useState<Record<string, TabId>>({});
  const getTab = (id: string) => activeTabs[id] ?? 'services';
  const setTab = (centerId: string, tab: TabId) =>
    setActiveTabs(prev => ({ ...prev, [centerId]: tab }));

  // Service list is kept in local state per center so tabs can mutate without refetching
  const [localServices, setLocalServices] = useState<Record<string, Service[]>>({});
  function getServices(center: CenterWithServices) {
    return localServices[center.id] ?? center.services;
  }
  function setServices(centerId: string, svcs: Service[]) {
    setLocalServices(prev => ({ ...prev, [centerId]: svcs }));
  }

  if (!isReady || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-aqua-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link
          href="/vendor/onboarding"
          className="px-4 py-2 bg-aqua-500 text-white text-sm font-semibold rounded-lg hover:bg-aqua-600 transition-colors"
        >
          + Add Center
        </Link>
      </div>

      {/* Empty state */}
      {centers.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-14 h-14 bg-arctic-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-aqua-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No centers yet</h3>
          <p className="text-sm text-gray-500 mb-4">Register your car wash center to start accepting bookings.</p>
          <Link
            href="/vendor/onboarding"
            className="inline-block px-6 py-2 bg-aqua-500 text-white text-sm font-semibold rounded-lg hover:bg-aqua-600 transition-colors"
          >
            Register Your Center
          </Link>
        </div>
      )}

      {/* Center cards */}
      {centers.map(center => {
        const style     = STATUS_STYLES[center.status] ?? STATUS_STYLES['pending'];
        const activeTab = getTab(center.id);
        const isActive  = center.status === 'active';

        return (
          <div key={center.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Center header */}
            <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-gray-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900">{center.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{center.address}</p>
                <p className="text-xs text-gray-400 mt-1">{style.hint}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-aqua-500">
                  {center.avg_rating > 0 ? Number(center.avg_rating).toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-400">{center.total_reviews} reviews</p>
              </div>
            </div>

            {/* Tabs — only for active centers */}
            {isActive ? (
              <>
                <div className="flex border-b border-gray-100">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTab(center.id, tab.id)}
                      className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-aqua-500 text-aqua-600'
                          : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="px-6 py-5">
                  {activeTab === 'services' && (
                    <ServicesTab
                      centerId={center.id}
                      services={getServices(center)}
                      onChange={svcs => setServices(center.id, svcs)}
                    />
                  )}
                  {activeTab === 'slots' && (
                    <SlotsTab centerId={center.id} />
                  )}
                  {activeTab === 'bookings' && (
                    <BookingsTab centerId={center.id} />
                  )}
                  {activeTab === 'reviews' && (
                    <ReviewsTab centerId={center.id} />
                  )}
                  {activeTab === 'analytics' && (
                    <AnalyticsTab centerId={center.id} />
                  )}
                  {activeTab === 'ai-insights' && (
                    <AIInsightsTab centerId={center.id} />
                  )}
                </div>
              </>
            ) : (
              <div className="px-6 py-4 text-sm text-gray-400">
                Services, slots, and bookings will be available once your center is approved.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
