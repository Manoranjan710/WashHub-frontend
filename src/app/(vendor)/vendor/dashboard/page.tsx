'use client';

import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';
import { Center, Service } from '@/types/center';

type CenterWithServices = Center & { services: Service[] };

async function fetchMyCenters(): Promise<CenterWithServices[]> {
  const { data } = await api.get<ApiSuccess<CenterWithServices[]>>('/centers/my');
  return data.data;
}

const STATUS_STYLES: Record<string, { badge: string; label: string; hint: string }> = {
  pending:   { badge: 'bg-yellow-100 text-yellow-800', label: 'Pending Review',  hint: 'Our team is reviewing your center. You\'ll be notified once approved.' },
  active:    { badge: 'bg-green-100 text-green-800',   label: 'Active',          hint: 'Your center is live and visible to customers.' },
  rejected:  { badge: 'bg-red-100 text-red-800',       label: 'Rejected',        hint: 'Your registration was rejected. Contact support for details.' },
  suspended: { badge: 'bg-gray-100 text-gray-700',     label: 'Suspended',       hint: 'Your center has been suspended. Contact support.' },
};

export default function VendorDashboardPage() {
  const { user, isReady } = useAuthGuard('vendor');

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['vendor', 'centers'],
    queryFn: fetchMyCenters,
    enabled: isReady,
  });

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

      {/* Centers list */}
      {centers.map((center) => {
        const style = STATUS_STYLES[center.status] ?? STATUS_STYLES['pending'];
        return (
          <div key={center.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Center header */}
            <div className="px-6 py-5 flex items-start justify-between gap-4">
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
                <p className="text-2xl font-bold text-aqua-500">{center.avg_rating > 0 ? center.avg_rating : '—'}</p>
                <p className="text-xs text-gray-400">{center.total_reviews} reviews</p>
              </div>
            </div>

            {/* Services */}
            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Services</h3>
              </div>

              {center.services.length === 0 ? (
                <p className="text-sm text-gray-400">
                  {center.status === 'active'
                    ? 'No services added yet. Add services so customers can book.'
                    : 'Services can be added once your center is approved.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {center.services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{svc.name}</p>
                        <p className="text-xs text-gray-500">{svc.duration_mins} min</p>
                      </div>
                      <p className="text-sm font-semibold text-deepsea-600 ml-3 shrink-0">
                        ₹{Number(svc.price).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
