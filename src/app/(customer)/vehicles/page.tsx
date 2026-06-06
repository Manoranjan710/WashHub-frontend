'use client';

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate_number: string;
  color?: string | null;
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-aqua-300';

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function VehiclesPage() {
  useAuthGuard('customer');

  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [deleteId, setDeleteId]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    api.get('/vehicles')
      .then(r => setVehicles(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleAdded(v: Vehicle) {
    setVehicles(prev => [...prev, v]);
    setShowForm(false);
  }

  function handleUpdated(v: Vehicle) {
    setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
    setEditId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/vehicles/${deleteId}`);
      setVehicles(prev => prev.filter(v => v.id !== deleteId));
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={!!deleteId}
        title="Remove vehicle?"
        message="Are you sure you want to remove this vehicle?"
        confirmLabel={deleting ? 'Removing…' : 'Yes, remove'}
        cancelLabel="Keep it"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-deepsea-600 py-10">
          <div className="max-w-2xl mx-auto px-4 flex items-center justify-between">
            <div>
              <Link
                href="/bookings/my"
                className="inline-flex items-center gap-1 text-arctic-100/60 hover:text-white text-sm mb-3 transition-colors"
              >
                <ChevronLeft /> My Bookings
              </Link>
              <h1 className="text-3xl font-bold text-white">My Vehicles</h1>
              <p className="text-arctic-100/70 text-sm mt-1">
                {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} saved
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">

          {/* Vehicle list */}
          {vehicles.length === 0 && !showForm && (
            <div className="text-center py-12">
              <p className="text-gray-400">No vehicles saved yet.</p>
            </div>
          )}

          {vehicles.map(vehicle => (
            <div key={vehicle.id}>
              {editId === vehicle.id ? (
                <VehicleForm
                  initial={vehicle}
                  onCancel={() => setEditId(null)}
                  onSaved={handleUpdated}
                />
              ) : (
                <VehicleCard
                  vehicle={vehicle}
                  onEdit={() => setEditId(vehicle.id)}
                  onDelete={() => setDeleteId(vehicle.id)}
                />
              )}
            </div>
          ))}

          {/* Add vehicle form / button */}
          {showForm ? (
            <VehicleForm
              onCancel={() => setShowForm(false)}
              onSaved={handleAdded}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-gray-400 rounded-2xl py-4 text-sm text-gray-800 hover:border-aqua-300 hover:text-aqua-500 transition-colors"
            >
              + Add a vehicle
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── VehicleCard ───────────────────────────────────────────────────────── */

function VehicleCard({
  vehicle, onEdit, onDelete,
}: {
  vehicle: Vehicle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-semibold text-gray-800">{vehicle.make} {vehicle.model}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-aqua-800 font-bold ">{vehicle.plate_number}</span>
          {vehicle.color && (
            <span className="text-xs text-gray-700 bg-aqua-300 border border-gray-100 px-2 py-0.5 rounded-full">
              {vehicle.color}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onEdit}
          className="text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="text-sm border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

/* ─── VehicleForm ───────────────────────────────────────────────────────── */

function VehicleForm({
  initial, onCancel, onSaved,
}: {
  initial?: Vehicle;
  onCancel: () => void;
  onSaved: (v: Vehicle) => void;
}) {
  const [form, setForm] = useState({
    make:         initial?.make         ?? '',
    model:        initial?.model        ?? '',
    plate_number: initial?.plate_number ?? '',
    color:        initial?.color        ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      make:         form.make,
      model:        form.model,
      plate_number: form.plate_number,
      ...(form.color.trim() ? { color: form.color.trim() } : {}),
    };
    try {
      let data;
      if (initial) {
        ({ data } = await api.put(`/vehicles/${initial.id}`, payload));
      } else {
        ({ data } = await api.post('/vehicles', payload));
      }
      onSaved(data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to save vehicle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-aqua-200 shadow-sm px-5 py-5 space-y-4"
    >
      <p className="text-sm font-semibold text-deepsea-600">
        {initial ? 'Edit vehicle' : 'New vehicle'}
      </p>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Make</label>
          <input required placeholder="e.g. Maruti" value={form.make} onChange={set('make')} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Model</label>
          <input required placeholder="e.g. Swift" value={form.model} onChange={set('model')} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Plate number</label>
          <input required placeholder="e.g. MH12AB1234" value={form.plate_number} onChange={set('plate_number')} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Color (optional)</label>
          <input placeholder="e.g. White" value={form.color} onChange={set('color')} className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-aqua-500 hover:bg-aqua-600 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
