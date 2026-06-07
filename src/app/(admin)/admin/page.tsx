'use client';

import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface VendorCenter {
  id: string;
  name: string;
  address: string;
  status: string;
  created_at: string;
  vendor: { name: string; email: string; phone?: string | null };
}

interface AnalyticsData {
  totals: {
    bookings:              number;
    bookingsThisMonth:     number;
    revenue:               number;
    revenueThisMonth:      number;
    customers:             number;
    newCustomersThisMonth: number;
    activeCenters:         number;
    reviews:               number;
  };
  bookingsPerDay: Array<{ date: string; count: number }>;
}

/* ── Fetchers ───────────────────────────────────────────────────────────────── */

async function fetchPendingCenters(): Promise<VendorCenter[]> {
  const { data } = await api.get<ApiSuccess<VendorCenter[]>>('/centers/admin/all?status=pending');
  return data.data;
}

async function fetchAllCenters(): Promise<VendorCenter[]> {
  const { data } = await api.get<ApiSuccess<VendorCenter[]>>('/centers/admin/all');
  return data.data;
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const { data } = await api.get<ApiSuccess<AnalyticsData>>('/admin/analytics');
  return data.data;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  active:    'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  suspended: 'bg-gray-100 text-gray-700',
};

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate';

interface PendingAction {
  type: ActionType;
  centerId: string;
  centerName: string;
}

const ACTION_CONFIG: Record<ActionType, { title: string; message: (name: string) => string; confirmLabel: string }> = {
  approve:    { title: 'Approve Center?',    message: (n) => `Approve "${n}"? It will go live immediately.`,                               confirmLabel: 'Yes, Approve'    },
  reject:     { title: 'Reject Center?',     message: (n) => `Reject "${n}"? The vendor will be notified.`,                               confirmLabel: 'Yes, Reject'     },
  suspend:    { title: 'Suspend Center?',    message: (n) => `Suspend "${n}"? It will be hidden from customers immediately.`,             confirmLabel: 'Yes, Suspend'    },
  reactivate: { title: 'Reactivate Center?', message: (n) => `Reactivate "${n}"? It will become visible to customers again.`,             confirmLabel: 'Yes, Reactivate' },
};

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatChartDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TOOLTIP_STYLE = {
  fontSize:     12,
  borderRadius: 10,
  border:       '1px solid #e5e7eb',
  boxShadow:    '0 4px 20px rgba(0,0,0,0.10)',
  padding:      '8px 12px',
};

/* ── Component ──────────────────────────────────────────────────────────────── */

type Tab = 'centers' | 'analytics';

export default function AdminDashboardPage() {
  const { user, isReady } = useAuthGuard('admin');
  const queryClient       = useQueryClient();
  const [activeTab, setActiveTab]       = useState<Tab>('centers');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['admin', 'centers', 'pending'],
    queryFn:  fetchPendingCenters,
    enabled:  isReady,
  });

  const { data: all = [], isLoading: loadingAll } = useQuery({
    queryKey: ['admin', 'centers', 'all'],
    queryFn:  fetchAllCenters,
    enabled:  isReady,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn:  fetchAnalytics,
    enabled:  isReady && activeTab === 'analytics',
    staleTime: 5 * 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/centers/admin/${id}/approve`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/centers/admin/${id}/reject`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] }),
  });
  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/centers/admin/${id}/suspend`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['admin', 'centers'] }),
  });

  function handleConfirm() {
    if (!pendingAction) return;
    const { type, centerId } = pendingAction;
    setPendingAction(null);
    if (type === 'approve' || type === 'reactivate') approveMutation.mutate(centerId);
    else if (type === 'reject')                       rejectMutation.mutate(centerId);
    else if (type === 'suspend')                      suspendMutation.mutate(centerId);
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-aqua-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const active       = all.filter(c => c.status === 'active').length;
  const suspended    = all.filter(c => c.status === 'suspended').length;
  const statsLoading = loadingPending || loadingAll;
  const cfg          = pendingAction ? ACTION_CONFIG[pendingAction.type] : null;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={!!pendingAction}
        title={cfg?.title}
        message={cfg ? cfg.message(pendingAction!.centerName) : ''}
        confirmLabel={cfg?.confirmLabel}
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['centers', 'analytics'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white text-deepsea-700 shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'centers' ? 'Centers' : 'Analytics'}
          </button>
        ))}
      </div>

      {/* ── Centers Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'centers' && (
        <div className="space-y-6">
          {/* Center stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Centers',  value: all.length,     color: 'text-aqua-500'    },
              { label: 'Pending Review', value: pending.length, color: 'text-yellow-600'  },
              { label: 'Active',         value: active,         color: 'text-green-600'   },
              { label: 'Suspended',      value: suspended,      color: 'text-gray-500'    },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 shadow-md p-5">
                <p className="text-sm text-gray-500">{stat.label}</p>
                {statsLoading ? (
                  <div className="mt-2 h-7 w-12 rounded bg-gray-200 animate-pulse" />
                ) : (
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                )}
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
                {pending.map(center => (
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
                        onClick={() => setPendingAction({ type: 'approve', centerId: center.id, centerName: center.name })}
                        disabled={approveMutation.isPending}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setPendingAction({ type: 'reject', centerId: center.id, centerName: center.name })}
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
                {all.map(center => (
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
                        onClick={() => setPendingAction({ type: 'suspend', centerId: center.id, centerName: center.name })}
                        disabled={suspendMutation.isPending}
                        className="shrink-0 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                    {(center.status === 'rejected' || center.status === 'suspended') && (
                      <button
                        onClick={() => setPendingAction({
                          type:       center.status === 'suspended' ? 'reactivate' : 'approve',
                          centerId:   center.id,
                          centerName: center.name,
                        })}
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
      )}

      {/* ── Analytics Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loadingAnalytics ? (
            <div className="flex justify-center py-20">
              <span className="w-8 h-8 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
            </div>
          ) : analytics ? (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Bookings"
                  value={analytics.totals.bookings.toLocaleString()}
                  sub={`+${analytics.totals.bookingsThisMonth} this month`}
                  color="text-aqua-600"
                />
                <StatCard
                  label="Total Revenue"
                  value={formatINR(analytics.totals.revenue)}
                  sub={`${formatINR(analytics.totals.revenueThisMonth)} this month`}
                  color="text-green-600"
                />
                <StatCard
                  label="Total Customers"
                  value={analytics.totals.customers.toLocaleString()}
                  sub={`+${analytics.totals.newCustomersThisMonth} this month`}
                  color="text-deepsea-600"
                />
                <StatCard
                  label="Total Reviews"
                  value={analytics.totals.reviews.toLocaleString()}
                  sub={`${analytics.totals.activeCenters} active centers`}
                  color="text-yellow-600"
                />
              </div>

              {/* Bookings per day chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
                <h2 className="font-semibold text-gray-900 mb-6">Bookings — Last 30 Days</h2>
                {analytics.bookingsPerDay.length === 0 ? (
                  <p className="text-sm text-gray-400 py-10 text-center">No booking data for the last 30 days.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={analytics.bookingsPerDay} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#0ea5c8" stopOpacity={0.40} />
                          <stop offset="75%"  stopColor="#0ea5c8" stopOpacity={0.08} />
                          <stop offset="100%" stopColor="#0ea5c8" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatChartDate}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        allowDecimals={false}
                        width={32}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        labelFormatter={(v) => formatChartDate(String(v))}
                        formatter={(v) => [v, 'Bookings']}
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ stroke: '#0ea5c8', strokeWidth: 1, strokeDasharray: '5 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#0ea5c8"
                        strokeWidth={2.5}
                        fill="url(#bookingGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#0ea5c8', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500">Failed to load analytics. Please refresh.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-white shadow-md rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
