'use client';

import { useState, FormEvent } from 'react';
import { api } from '@/lib/axios';

interface Props { centerId: string }

const today = new Date().toISOString().slice(0, 10);

const defaultForm = {
  date_from:     today,
  date_to:       today,
  open_time:     '09:00',
  close_time:    '18:00',
  interval_mins: '60',
  capacity:      '3',
};

export default function SlotsTab({ centerId }: Props) {
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError]     = useState<string | null>(null);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setResult(null);
    };
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post(`/centers/${centerId}/slots/bulk`, {
        date_from:     form.date_from,
        date_to:       form.date_to,
        open_time:     form.open_time,
        close_time:    form.close_time,
        interval_mins: Number(form.interval_mins),
        capacity:      Number(form.capacity),
      });
      setResult(data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to generate slots. Check your time range.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-4">
      <p className="text-sm text-gray-500">
        Generate time slots in bulk for a date range. Customers will be able to book these slots.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {result && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          ✓ {result.created} slot{result.created !== 1 ? 's' : ''} created
          {result.skipped > 0 ? `, ${result.skipped} already existed and were skipped.` : '.'}
        </p>
      )}

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>From date</label>
          <input type="date" required min={today} value={form.date_from} onChange={field('date_from')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>To date</label>
          <input type="date" required min={form.date_from} value={form.date_to} onChange={field('date_to')} className={inputCls} />
        </div>
      </div>

      {/* Time range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Opening time</label>
          <input type="time" required value={form.open_time} onChange={field('open_time')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Closing time</label>
          <input type="time" required value={form.close_time} onChange={field('close_time')} className={inputCls} />
        </div>
      </div>

      {/* Interval + capacity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Slot duration</label>
          <select value={form.interval_mins} onChange={field('interval_mins')} className={inputCls}>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
            <option value="90">90 minutes</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Cars per slot</label>
          <input type="number" required min="1" max="20" value={form.capacity} onChange={field('capacity')} className={inputCls} />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-deepsea-600 hover:bg-deepsea-700 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-60"
      >
        {loading ? 'Generating…' : 'Generate Slots'}
      </button>
    </form>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-aqua-300';
const labelCls = 'block text-xs text-gray-500 mb-1';
