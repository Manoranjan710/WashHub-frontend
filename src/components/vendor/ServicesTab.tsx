'use client';

import { useState, FormEvent } from 'react';
import { api } from '@/lib/axios';
import { Service } from '@/types/center';

interface Props {
  centerId: string;
  services: Service[];
  onChange: (services: Service[]) => void;
}

const empty = { name: '', description: '', price: '', duration_mins: '' };

export default function ServicesTab({ centerId, services, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [togglingId, setTogglingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.post(`/centers/${centerId}/services`, {
        name:         form.name.trim(),
        description:  form.description.trim() || undefined,
        price:        Number(form.price),
        duration_mins: Number(form.duration_mins),
      });
      onChange([...services, data.data]);
      setForm(empty);
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to add service.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(svc: Service) {
    setTogglingId(svc.id);
    try {
      const { data } = await api.put(`/centers/${centerId}/services/${svc.id}`, {
        is_active: !svc.is_active,
      });
      onChange(services.map(s => s.id === svc.id ? data.data : s));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/centers/${centerId}/services/${id}`);
      onChange(services.filter(s => s.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Service list */}
      {services.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">No services yet. Add one so customers can book.</p>
      )}

      {services.length > 0 && (
        <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          {services.map(svc => (
            <div key={svc.id} className={`flex items-center gap-3 px-4 py-3 ${svc.is_active ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${svc.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                    {svc.name}
                  </p>
                  {!svc.is_active && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Off</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{svc.duration_mins} min · ₹{Number(svc.price).toLocaleString('en-IN')}</p>
              </div>

              <button
                onClick={() => handleToggle(svc)}
                disabled={togglingId === svc.id}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50
                  ${svc.is_active
                    ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    : 'border-aqua-200 text-aqua-600 hover:bg-aqua-50'}`}
              >
                {togglingId === svc.id ? '…' : svc.is_active ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => handleDelete(svc.id)}
                disabled={deletingId === svc.id}
                className="text-xs px-2.5 py-1 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deletingId === svc.id ? '…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="border border-aqua-100 rounded-xl p-4 bg-arctic-100/20 space-y-3">
          <p className="text-sm font-semibold text-deepsea-600">New service</p>
          {error && <p className="text-xs text-red-600">{error}</p>}

          <input
            required placeholder="Service name (e.g. Full Body Wash)"
            value={form.name} onChange={field('name')}
            className={inputCls}
          />
          <input
            placeholder="Description (optional)"
            value={form.description} onChange={field('description')}
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              required type="number" min="1" placeholder="Price (₹)"
              value={form.price} onChange={field('price')}
              className={inputCls}
            />
            <input
              required type="number" min="5" placeholder="Duration (min)"
              value={form.duration_mins} onChange={field('duration_mins')}
              className={inputCls}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setForm(empty); setError(null); }}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-aqua-500 hover:bg-aqua-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving…' : 'Add Service'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-aqua-300 hover:text-aqua-500 transition-colors"
        >
          + Add Service
        </button>
      )}
    </div>
  );
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-aqua-300';
