'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';

interface VendorCenter {
  id: string;
  name: string;
  address: string;
  status: string;
  created_at: string;
  vendor: { name: string; email: string; phone?: string | null };
}

async function fetchPendingCenters(): Promise<VendorCenter[]> {
  const { data } = await api.get<ApiSuccess<VendorCenter[]>>('/centers/admin/all?status=pending');
  return data.data;
}

async function fetchAllCenters(): Promise<VendorCenter[]> {
  const { data } = await api.get<ApiSuccess<VendorCenter[]>>('/centers/admin/all');
  return data.data;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  active:    'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-700',
};

export default function AdminDashboardPage() {
  const { user, isReady } = useAuthGuard('admin');
  const queryClient = useQueryClient();

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['admin', 'centers', 'pending'],
    queryFn: fetchPendingCenters,
    enabled: isReady,
  });

  const { data: all = [], isLoading: loadingAll } = useQuery({
    queryKey: ['admin', 'centers', 'all'],
    queryFn: fetchAllCenters,
    enabled: isReady,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/centers/admin/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/centers/admin/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/centers/admin/${id}/suspend`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] });
    },
  });

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-aqua-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const active    = all.filter((c) => c.status === 'active').length;
  const suspended = all.filter((c) => c.status === 'suspended').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Centers',   value: all.length,      color: 'text-aqua-500' },
          { label: 'Pending Review',  value: pending.length,  color: 'text-yellow-600' },
          { label: 'Active',          value: active,          color: 'text-green-600' },
          { label: 'Suspended',       value: suspended,       color: 'text-gray-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Pending Vendor Registrations
            {pending.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                {pending.length}
              </span>
            )}
          </h2>
        </div>

        {loadingPending ? (
          <div className="p-6 text-sm text-gray-400">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">No pending registrations. All clear!</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map((center) => (
              <div key={center.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{center.name}</p>
                  <p className="text-sm text-gray-500 truncate">{center.address}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    by <span className="font-medium text-gray-600">{center.vendor.name}</span>
                    {' · '}{center.vendor.email}
                    {' · '}{new Date(center.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveMutation.mutate(center.id)}
                    disabled={approveMutation.isPending}
                    className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(center.id)}
                    disabled={rejectMutation.isPending}
                    className="px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All centers */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Centers</h2>
        </div>

        {loadingAll ? (
          <div className="p-6 text-sm text-gray-400">Loading...</div>
        ) : all.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">No centers registered yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {all.map((center) => (
              <div key={center.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{center.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[center.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {center.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{center.address}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{center.vendor.name} · {center.vendor.email}</p>
                </div>
                {center.status === 'active' && (
                  <button
                    onClick={() => suspendMutation.mutate(center.id)}
                    disabled={suspendMutation.isPending}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                  >
                    Suspend
                  </button>
                )}
                {(center.status === 'rejected' || center.status === 'suspended') && (
                  <button
                    onClick={() => approveMutation.mutate(center.id)}
                    disabled={approveMutation.isPending}
                    className="shrink-0 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {center.status === 'suspended' ? 'Reactivate' : 'Approve'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
