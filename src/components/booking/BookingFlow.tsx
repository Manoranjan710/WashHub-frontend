'use client';

import { useState, useEffect, FormEvent, CSSProperties } from 'react';
import Link from 'next/link';
import { FixedSizeList } from 'react-window';
import { api } from '@/lib/axios';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { CenterDetail, Service } from '@/types/center';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Slot {
  id: string;
  start_time: string; // ISO — stored as 1970-01-01THH:MM:00.000Z
  capacity: number;
  booked_count: number;
  available_spots: number;
  is_available: boolean;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  plate_number: string;
  color?: string | null;
}

interface BookingResult {
  id: string;
  price_paid: number;
  center: { name: string; address: string };
  service: { name: string; duration_mins: number };
  slot: { date: string; start_time: string };
  vehicle: { make: string; model: string; plate_number: string };
}

type BookingStep = 'date' | 'slot' | 'vehicle' | 'confirm' | 'done';

const STEP_LABELS: Record<Exclude<BookingStep, 'done'>, string> = {
  date:    'Date',
  slot:    'Time Slot',
  vehicle: 'Vehicle',
  confirm: 'Confirm',
};
const STEP_ORDER: Exclude<BookingStep, 'done'>[] = ['date', 'slot', 'vehicle', 'confirm'];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC',
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/* ─── Root component ────────────────────────────────────────────────────── */

interface Props { centerId: string; serviceId: string }

export default function BookingFlow({ centerId, serviceId }: Props) {
  const { isReady } = useAuthGuard('customer');

  // Remote data
  const [center, setCenter]     = useState<CenterDetail | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState<string | null>(null);

  // Booking state
  const [step, setStep]                   = useState<BookingStep>('date');
  const [date, setDate]                   = useState('');
  const [slots, setSlots]                 = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [selectedSlot, setSelectedSlot]   = useState<Slot | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [bookingErr, setBookingErr]       = useState<string | null>(null);
  const [result, setResult]               = useState<BookingResult | null>(null);

  // Inline add-vehicle form
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newV, setNewV]     = useState({ make: '', model: '', plate_number: '', color: '' });
  const [addingV, setAddingV]   = useState(false);
  const [addVErr, setAddVErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    Promise.all([api.get(`/centers/${centerId}`), api.get('/vehicles')])
      .then(([c, v]) => { setCenter(c.data.data); setVehicles(v.data.data ?? []); })
      .catch(() => setLoadErr('Failed to load booking data. Please try again.'))
      .finally(() => setLoading(false));
  }, [centerId, isReady]);

  const service: Service | undefined = center?.services.find(s => s.id === serviceId);
  const today = new Date().toISOString().slice(0, 10);

  async function fetchSlots(d: string, silent = false) {
    if (!silent) { setSlotsLoading(true); setSlots([]); setSelectedSlot(null); }
    try {
      const { data } = await api.get(`/centers/${centerId}/slots`, { params: { date: d } });
      setSlots(data.data ?? []);
    } finally {
      if (!silent) setSlotsLoading(false);
    }
  }

  // Poll slot availability every 30s while on the slot step
  useEffect(() => {
    if (step !== 'slot' || !date) return;
    const id = setInterval(() => fetchSlots(date, true), 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, date]);

  async function handleAddVehicle(e: FormEvent) {
    e.preventDefault();
    setAddingV(true);
    setAddVErr(null);
    try {
      const payload = { make: newV.make, model: newV.model, plate_number: newV.plate_number, ...(newV.color ? { color: newV.color } : {}) };
      const { data } = await api.post('/vehicles', payload);
      const added: Vehicle = data.data;
      setVehicles(prev => [...prev, added]);
      setSelectedVehicle(added);
      setShowAddVehicle(false);
      setNewV({ make: '', model: '', plate_number: '', color: '' });
    } catch {
      setAddVErr('Failed to add vehicle. Check your details and try again.');
    } finally {
      setAddingV(false);
    }
  }

  async function handleConfirm() {
    if (!selectedSlot || !selectedVehicle) return;
    setSubmitting(true);
    setBookingErr(null);
    try {
      const { data } = await api.post('/bookings', {
        center_id:  centerId,
        service_id: serviceId,
        slot_id:    selectedSlot.id,
        vehicle_id: selectedVehicle.id,
      });
      setResult(data.data);
      setStep('done');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setBookingErr(msg ?? 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Guards ─────────────────────────────────────────────────────────── */

  if (!isReady || loading) return <PageSpinner />;

  if (loadErr || !center) {
    return (
      <ErrorScreen message={loadErr ?? 'Center not found.'}>
        <Link href="/centers" className="text-aqua-500 underline">Back to centers</Link>
      </ErrorScreen>
    );
  }

  if (!service) {
    return (
      <ErrorScreen message="Service not found or no longer available.">
        <Link href={`/centers/${centerId}`} className="text-aqua-500 underline">Back to center</Link>
      </ErrorScreen>
    );
  }

  if (step === 'done' && result) return <SuccessScreen result={result} />;

  /* ── Layout ─────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-deepsea-600 py-10">
        <div className="max-w-2xl mx-auto px-4">
          <Link
            href={`/centers/${centerId}`}
            className="inline-flex items-center gap-1.5 text-arctic-100/70 hover:text-white text-sm mb-5 transition-colors"
          >
            <ChevronLeft /> Back to {center.name}
          </Link>
          <h1 className="text-2xl font-bold text-white">Book a Service</h1>
          <p className="text-arctic-100/80 text-sm mt-1.5">
            {service.name}&ensp;·&ensp;₹{Number(service.price).toLocaleString('en-IN')}&ensp;·&ensp;{service.duration_mins} min
          </p>
        </div>
      </div>

      {/* Step progress */}
      <StepIndicator current={step} />

      {/* Step panels */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {step === 'date' && (
          <StepCard title="Select a date">
            <input
              type="date"
              min={today}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-aqua-400"
            />
            <StepNav
              onNext={() => { if (date) { fetchSlots(date); setStep('slot'); } }}
              nextDisabled={!date}
            />
          </StepCard>
        )}

        {step === 'slot' && (
          <StepCard title={`Available slots — ${formatDate(`${date}T00:00:00.000Z`)}`}>
            {slotsLoading ? (
              <div className="flex justify-center py-10"><PageSpinner small /></div>
            ) : slots.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No slots available on this date.</p>
            ) : (
              <VirtualSlotPicker
                slots={slots}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}
            <StepNav
              onBack={() => setStep('date')}
              onNext={() => { if (selectedSlot) setStep('vehicle'); }}
              nextDisabled={!selectedSlot}
            />
          </StepCard>
        )}

        {step === 'vehicle' && (
          <StepCard title="Select your vehicle">
            {vehicles.length > 0 && (
              <div className="space-y-2 mb-4">
                {vehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all
                      ${selectedVehicle?.id === v.id
                        ? 'border-aqua-500 bg-aqua-50 text-deepsea-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-aqua-300'
                      }`}
                  >
                    <span className="font-medium">{v.make} {v.model}</span>
                    <span className="text-gray-400">{v.plate_number}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Add vehicle inline */}
            {!showAddVehicle ? (
              <button
                onClick={() => setShowAddVehicle(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-aqua-300 hover:text-aqua-500 transition-colors"
              >
                + Add a vehicle
              </button>
            ) : (
              <form onSubmit={handleAddVehicle} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
                <p className="text-sm font-semibold text-deepsea-600">New vehicle</p>
                {addVErr && <p className="text-red-600 text-xs">{addVErr}</p>}
                <div className="grid grid-cols-2 gap-2">
                  <input required placeholder="Make (e.g. Maruti)" value={newV.make} onChange={e => setNewV(p => ({ ...p, make: e.target.value }))}
                    className={inputCls} />
                  <input required placeholder="Model (e.g. Swift)" value={newV.model} onChange={e => setNewV(p => ({ ...p, model: e.target.value }))}
                    className={inputCls} />
                  <input required placeholder="Plate number" value={newV.plate_number} onChange={e => setNewV(p => ({ ...p, plate_number: e.target.value }))}
                    className={inputCls} />
                  <input placeholder="Color (optional)" value={newV.color} onChange={e => setNewV(p => ({ ...p, color: e.target.value }))}
                    className={inputCls} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddVehicle(false)}
                    className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={addingV}
                    className="flex-1 bg-aqua-500 hover:bg-aqua-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
                    {addingV ? 'Saving…' : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            )}

            <StepNav
              onBack={() => setStep('slot')}
              onNext={() => { if (selectedVehicle) setStep('confirm'); }}
              nextDisabled={!selectedVehicle}
            />
          </StepCard>
        )}

        {step === 'confirm' && selectedSlot && selectedVehicle && (
          <StepCard title="Confirm your booking">
            {bookingErr && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-2">
                {bookingErr}
              </div>
            )}
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden">
              <SummaryRow label="Center"  value={center.name} />
              <SummaryRow label="Service" value={`${service.name} — ${service.duration_mins} min`} />
              <SummaryRow label="Date"    value={formatDate(`${date}T00:00:00.000Z`)} />
              <SummaryRow label="Time"    value={formatTime(selectedSlot.start_time)} />
              <SummaryRow label="Vehicle" value={`${selectedVehicle.make} ${selectedVehicle.model} · ${selectedVehicle.plate_number}`} />
              <SummaryRow label="Amount"  value={`₹${Number(service.price).toLocaleString('en-IN')}`} highlight />
            </div>
            <StepNav
              onBack={() => setStep('vehicle')}
              onNext={handleConfirm}
              nextLabel={submitting ? 'Booking…' : 'Confirm Booking'}
              nextDisabled={submitting}
              nextHighlight
            />
          </StepCard>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ────────────────────────────────────────────────────── */

/* ─── Virtualised slot picker ───────────────────────────────────────────── */

const SLOT_COLS = 3;
const ROW_HEIGHT = 72; // px per row including gap

function VirtualSlotPicker({
  slots, selected, onSelect,
}: {
  slots: Slot[];
  selected: Slot | null;
  onSelect: (s: Slot) => void;
}) {
  const rowCount = Math.ceil(slots.length / SLOT_COLS);
  const listHeight = Math.min(rowCount * ROW_HEIGHT, 288); // cap at ~4 rows

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={{ ...style, display: 'flex', gap: 8, paddingBottom: 8 }}>
      {Array.from({ length: SLOT_COLS }, (_, col) => {
        const slotIdx = index * SLOT_COLS + col;
        if (slotIdx >= slots.length) return <div key={col} style={{ flex: 1 }} />;
        const slot = slots[slotIdx];
        const isSelected = selected?.id === slot.id;
        return (
          <button
            key={slot.id}
            disabled={!slot.is_available}
            onClick={() => onSelect(slot)}
            style={{ flex: 1 }}
            className={`rounded-xl border py-3 text-sm font-medium transition-all
              ${!slot.is_available
                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                : isSelected
                  ? 'border-aqua-500 bg-aqua-500 text-white shadow'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-aqua-400'
              }`}
          >
            {formatTime(slot.start_time)}
            {slot.is_available && (
              <span className={`block text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                {slot.available_spots} left
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <FixedSizeList
      height={listHeight}
      itemCount={rowCount}
      itemSize={ROW_HEIGHT}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

function StepIndicator({ current }: { current: BookingStep }) {
  const idx = current === 'done' ? 4 : STEP_ORDER.indexOf(current as Exclude<BookingStep, 'done'>);
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <ol className="flex items-center gap-0">
          {STEP_ORDER.map((s, i) => {
            const done    = i < idx;
            const active  = i === idx;
            return (
              <li key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${done   ? 'bg-aqua-500 text-white'
                    : active ? 'bg-deepsea-600 text-white ring-4 ring-deepsea-100'
                             : 'bg-gray-100 text-gray-400'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={`mt-1.5 text-xs font-medium ${active ? 'text-deepsea-600' : done ? 'text-aqua-500' : 'text-gray-400'}`}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEP_ORDER.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 rounded ${i < idx ? 'bg-aqua-400' : 'bg-gray-100'}`} />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-deepsea-600">{title}</h2>
      {children}
    </div>
  );
}

function StepNav({
  onBack, onNext, nextDisabled = false, nextLabel = 'Next', nextHighlight = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextHighlight?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button onClick={onBack}
          className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Back
        </button>
      )}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled}
          className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50
            ${nextHighlight
              ? 'bg-deepsea-600 hover:bg-deepsea-700 text-white'
              : 'bg-aqua-500 hover:bg-aqua-600 text-white'}`}>
          {nextLabel}
        </button>
      )}
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-deepsea-600 text-base' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function SuccessScreen({ result }: { result: BookingResult }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-deepsea-600 py-8 text-center">
          <span className="text-4xl">&#10003;</span>
          <h2 className="text-white text-xl font-bold mt-2">Booking Confirmed!</h2>
          <p className="text-arctic-100/70 text-sm mt-1">Your car wash is scheduled</p>
        </div>
        <div className="divide-y divide-gray-100">
          <SummaryRow label="Center"  value={result.center.name} />
          <SummaryRow label="Service" value={result.service.name} />
          <SummaryRow label="Date"    value={formatDate(result.slot.date)} />
          <SummaryRow label="Time"    value={formatTime(result.slot.start_time)} />
          <SummaryRow label="Vehicle" value={result.vehicle.plate_number} />
          <SummaryRow label="Amount paid" value={`₹${Number(result.price_paid).toLocaleString('en-IN')}`} highlight />
        </div>
        <div className="p-5 flex flex-col gap-3">
          <Link
            href="/bookings/my"
            className="block w-full text-center bg-aqua-500 hover:bg-aqua-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            View My Bookings
          </Link>
          <Link
            href="/centers"
            className="block w-full text-center border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
          >
            Find Another Center
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <p className="text-gray-600">{message}</p>
      {children}
    </div>
  );
}

function PageSpinner({ small }: { small?: boolean }) {
  const sz = small ? 'w-6 h-6 border-2' : 'w-8 h-8 border-4';
  return (
    <div className="flex items-center justify-center py-4">
      <span className={`inline-block ${sz} border-aqua-200 border-t-aqua-500 rounded-full animate-spin`} />
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-aqua-300 w-full';
