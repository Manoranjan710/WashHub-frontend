'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { ApiSuccess } from '@/types/api';
import { Center } from '@/types/center';
import SuccessDialog from '@/components/ui/SuccessDialog';

/* ─── Validation ─────────────────────────────────────────────────────────── */

interface FormValues {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = 'Center name is required.';
  } else if (name.length < 3) {
    errors.name = 'Center name must be at least 3 characters.';
  } else if (name.length > 100) {
    errors.name = 'Center name must be 100 characters or fewer.';
  } else if (!/^[\w\s\-'&.,()]+$/i.test(name)) {
    errors.name = 'Center name contains invalid characters.';
  }

  const address = values.address.trim();
  if (!address) {
    errors.address = 'Address is required.';
  } else if (address.length < 10) {
    errors.address = 'Please enter a complete address (at least 10 characters).';
  } else if (address.length > 300) {
    errors.address = 'Address must be 300 characters or fewer.';
  }

  const lat = values.latitude.trim();
  if (!lat) {
    errors.latitude = 'Latitude is required.';
  } else {
    const n = Number(lat);
    if (isNaN(n)) {
      errors.latitude = 'Latitude must be a number.';
    } else if (n < -90 || n > 90) {
      errors.latitude = 'Latitude must be between -90 and 90.';
    }
  }

  const lng = values.longitude.trim();
  if (!lng) {
    errors.longitude = 'Longitude is required.';
  } else {
    const n = Number(lng);
    if (isNaN(n)) {
      errors.longitude = 'Longitude must be a number.';
    } else if (n < -180 || n > 180) {
      errors.longitude = 'Longitude must be between -180 and 180.';
    }
  }

  return errors;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const REDIRECT_SECS = 3;

function fieldCls(error?: string, touched?: boolean, value?: string) {
  const base = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors';
  if (touched && error)  return `${base} border-red-400 focus:ring-red-300 bg-red-50`;
  if (touched && value?.trim()) return `${base} border-green-400 focus:ring-green-300`;
  return `${base} border-gray-300 focus:ring-aqua-400`;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><span>⚠</span>{msg}</p>;
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function VendorOnboardingPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormValues>({
    name: '', address: '', latitude: '', longitude: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [errors, setErrors]   = useState<FormErrors>({});
  const [locating, setLocating]   = useState(false);
  const [apiError, setApiError]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECS);

  // Re-validate whenever form values change
  useEffect(() => {
    setErrors(validate(form));
  }, [form]);

  // Auto-redirect countdown after successful submit
  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) { router.push('/vendor/dashboard'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [submitted, countdown, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setApiError('');
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  }

  function touchAll(): void {
    setTouched({ name: true, address: true, latitude: true, longitude: true });
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setApiError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude:  pos.coords.latitude.toFixed(7),
          longitude: pos.coords.longitude.toFixed(7),
        }));
        setTouched(prev => ({ ...prev, latitude: true, longitude: true }));
        setLocating(false);
      },
      () => {
        setApiError('Could not detect location. Please enter coordinates manually.');
        setLocating(false);
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    touchAll();

    const currentErrors = validate(form);
    if (Object.keys(currentErrors).length > 0) return;

    setLoading(true);
    try {
      await api.post<ApiSuccess<Center>>('/centers', {
        name:      form.name.trim(),
        address:   form.address.trim(),
        latitude:  parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      // Bust the dashboard cache so the new center appears immediately on redirect
      await queryClient.invalidateQueries({ queryKey: ['vendor', 'centers'] });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to submit center. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isValid = Object.keys(validate(form)).length === 0;

  return (
    <div className="max-w-xl mx-auto">
      <SuccessDialog
        open={submitted}
        title="Center Submitted!"
        message={`Your center has been submitted for review. Our team will approve it within 24 hours. Redirecting to your dashboard in ${countdown}s…`}
        actionLabel="Go to Dashboard Now"
        onClose={() => router.push('/vendor/dashboard')}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Register Your Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Submit your car wash center details. Our team will review and approve it within 24 hours.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Center name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Center name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g. Shine Auto Spa"
              maxLength={100}
              className={fieldCls(errors.name, touched.name, form.name)}
            />
            <FieldError msg={touched.name ? errors.name : undefined} />
            <p className="mt-1 text-xs text-gray-400 text-right">{form.name.length}/100</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={2}
              maxLength={300}
              placeholder="Shop 12, MG Road, Bengaluru - 560001"
              className={fieldCls(errors.address, touched.address, form.address) + ' resize-none'}
            />
            <FieldError msg={touched.address ? errors.address : undefined} />
            <p className="mt-1 text-xs text-gray-400 text-right">{form.address.length}/300</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location coordinates <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={locating}
              className="w-full py-2 px-4 border border-aqua-300 text-aqua-500 text-sm font-medium rounded-lg hover:bg-arctic-50 disabled:opacity-60 transition-colors mb-3"
            >
              {locating ? 'Detecting location…' : 'Detect my location'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="12.9716"
                  className={fieldCls(errors.latitude, touched.latitude, form.latitude)}
                />
                <FieldError msg={touched.latitude ? errors.latitude : undefined} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="77.5946"
                  className={fieldCls(errors.longitude, touched.longitude, form.longitude)}
                />
                <FieldError msg={touched.longitude ? errors.longitude : undefined} />
              </div>
            </div>
          </div>

          {/* API / server error */}
          {apiError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {apiError}
            </p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            Your center will be listed as <strong>pending review</strong>. Once approved by our team, it will appear in search results.
          </div>

          <button
            type="submit"
            disabled={loading || (!isValid && Object.keys(touched).length === 4)}
            className="w-full py-2.5 px-4 bg-aqua-500 text-white text-sm font-semibold rounded-lg hover:bg-aqua-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      </div>
    </div>
  );
}
