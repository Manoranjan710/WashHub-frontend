'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/axios';

interface VendorBooking {
  id: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  price_paid: number;
  created_at: string;
  customer: { name: string; email: string; phone?: string | null };
  service:  { name: string; duration_mins: number };
  slot:     { date: string; start_time: string };
  vehicle:  { make: string; model: string; plate_number: string; color?: string | null };
}

const STATUS_STYLE: Record<VendorBooking['status'], string> = {
  confirmed: 'bg-aqua-100 text-aqua-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show:   'bg-red-100 text-red-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
  });
}

interface Props { centerId: string }

export default function BookingsTab({ centerId }: Props) {
  const [bookings, setBookings]   = useState<VendorBooking[]>([]);
  const [loading, setLoading]     = useState(false);
  const [dateFilter, setDateFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [noShowId,     setNoShowId]     = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFilter)   params.date   = dateFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get(`/centers/${centerId}/bookings`, { params });
      setBookings(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [centerId, dateFilter, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleComplete(bookingId: string) {
    setCompletingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/complete`);
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: 'completed' } : b)
      );
    } finally {
      setCompletingId(null);
    }
  }

  async function handleNoShow(bookingId: string) {
    setNoShowId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/noshow`);
      setBookings(prev =>
        prev.map(b => b.id === bookingId ? { ...b, status: 'no_show' } : b)
      );
    } finally {
      setNoShowId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className={filterCls}
          title="Filter by date"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={filterCls}
        >
          <option value="">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        {(dateFilter || statusFilter) && (
          <button
            onClick={() => { setDateFilter(''); setStatusFilter(''); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline px-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="w-6 h-6 border-2 border-aqua-200 border-t-aqua-500 rounded-full animate-spin inline-block" />
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No bookings found{dateFilter || statusFilter ? ' for the selected filters' : ''}.
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{b.customer.name}</p>
                  <p className="text-xs text-gray-400">{b.customer.email}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[b.status]}`}>
                  {b.status}
                </span>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Info label="Service"  value={`${b.service.name} · ${b.service.duration_mins} min`} />
                <Info label="Date"     value={formatDate(b.slot.date)} />
                <Info label="Time"     value={formatTime(b.slot.start_time)} />
                <Info label="Vehicle"  value={`${b.vehicle.make} ${b.vehicle.model} · ${b.vehicle.plate_number}`} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-deepsea-600">
                  ₹{Number(b.price_paid).toLocaleString('en-IN')}
                </span>
                {b.status === 'confirmed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleNoShow(b.id)}
                      disabled={noShowId === b.id}
                      className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {noShowId === b.id ? 'Marking…' : 'No Show'}
                    </button>
                    <button
                      onClick={() => handleComplete(b.id)}
                      disabled={completingId === b.id}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {completingId === b.id ? 'Marking…' : 'Mark Complete'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-gray-700 font-medium leading-snug">{value}</p>
    </div>
  );
}

const filterCls = 'border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-aqua-300';
