'use client';

import { useEffect } from 'react';

interface SuccessDialogProps {
  open: boolean;
  message: string;
  title?: string;
  actionLabel?: string;
  onClose: () => void;
}

export default function SuccessDialog({
  open,
  message,
  title = 'Success',
  actionLabel = 'Continue',
  onClose,
}: SuccessDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-deepsea-900/40 backdrop-blur-sm animate-dialog-fade"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-arctic-100 p-7 text-center animate-dialog-pop">
        {/* Check icon */}
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-arctic-100 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-aqua-500 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 id="success-dialog-title" className="text-lg font-bold text-deepsea-600">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 w-full py-2.5 px-4 bg-aqua-500 text-white text-sm font-semibold rounded-lg hover:bg-aqua-600 transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
