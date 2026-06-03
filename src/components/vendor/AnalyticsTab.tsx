'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface DailyStat      { date: string; count: number; revenue: number; }
interface ServiceStat    { name: string; count: number; }
interface AnalyticsData  {
  summary:           { totalBookings: number; completedBookings: number; totalRevenue: number };
  dailyStats:        DailyStat[];
  servicePopularity: ServiceStat[];
}

const PIE_COLORS = ['#0ea5c8', '#0284c7', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function fmtINR(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function AnalyticsTab({ centerId }: { centerId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendor', 'analytics', centerId],
    queryFn:  async () => {
      const { data } = await api.get<ApiSuccess<AnalyticsData>>(`/centers/${centerId}/analytics`);
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="w-7 h-7 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-center py-12 text-sm text-gray-400">Failed to load analytics. Please refresh.</p>;
  }

  const { summary, dailyStats, servicePopularity } = data;

  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings',  value: summary.totalBookings.toLocaleString(),    color: 'text-aqua-600'    },
          { label: 'Completed',       value: summary.completedBookings.toLocaleString(), color: 'text-green-600'   },
          { label: 'Total Revenue',   value: fmtINR(summary.totalRevenue),              color: 'text-deepsea-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue — line chart */}
      <ChartCard title="Revenue — Last 30 Days" empty={dailyStats.length === 0}>
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={dailyStats} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
            <YAxis tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#6b7280' }} width={42} />
            <Tooltip
              labelFormatter={v => fmtDate(String(v))}
              formatter={v => [fmtINR(Number(v)), 'Revenue']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#0ea5c8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Bookings + Service — side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bookings per day — bar chart */}
        <ChartCard title="Bookings per Day — Last 30 Days" empty={dailyStats.length === 0}>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={dailyStats} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={24} />
              <Tooltip
                labelFormatter={v => fmtDate(String(v))}
                formatter={v => [v, 'Bookings']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="count" fill="#0ea5c8" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Service popularity — pie chart */}
        <ChartCard title="Service Popularity — Last 30 Days" empty={servicePopularity.length === 0} emptyMsg="No completed bookings yet.">
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={servicePopularity}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ percent }: { percent?: number }) => percent ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {servicePopularity.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [v, name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend below pie */}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {servicePopularity.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.name} ({s.count})
              </span>
            ))}
          </div>
        </ChartCard>

      </div>
    </div>
  );
}

function ChartCard({
  title, empty, emptyMsg = 'No data for the last 30 days.', children,
}: {
  title: string; empty: boolean; emptyMsg?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {empty
        ? <p className="text-sm text-gray-400 text-center py-10">{emptyMsg}</p>
        : children
      }
    </div>
  );
}
