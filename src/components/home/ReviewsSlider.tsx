'use client';

import { useState, useEffect } from 'react';

const reviews = [
  {
    id: 1,
    name: 'Arjun Mehta',
    location: 'Pune',
    rating: 5,
    text: 'Booked a premium wash in under 2 minutes. The center was spotless and the staff were incredibly professional. My car looks brand new!',
    service: 'Premium Exterior Wash',
    initials: 'AM',
    bgClass: 'bg-aqua-500',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Love that I can see real-time slot availability. No more waiting in long queues. Payment was instant via UPI and I got a confirmation email immediately.',
    service: 'Full Interior & Exterior',
    initials: 'PS',
    bgClass: 'bg-deepsea-500',
  },
  {
    id: 3,
    name: 'Rohan Das',
    location: 'Bangalore',
    rating: 4,
    text: 'Found a great center just 1.2 km away. The prices are transparent with no hidden charges. Will definitely use WashHub again.',
    service: 'Basic Wash & Vacuum',
    initials: 'RD',
    bgClass: 'bg-purple-500',
  },
  {
    id: 4,
    name: 'Sneha Kulkarni',
    location: 'Hyderabad',
    rating: 5,
    text: 'The 2-hour reminder email before my slot was such a thoughtful touch. Super convenient overall. Highly recommend to every car owner.',
    service: 'Detailing Package',
    initials: 'SK',
    bgClass: 'bg-emerald-500',
  },
  {
    id: 5,
    name: 'Vikram Singh',
    location: 'Delhi',
    rating: 5,
    text: 'As a vendor, listing my center was extremely easy. WashHub has helped me triple my monthly bookings with zero extra marketing effort.',
    service: 'Vendor — Center Owner',
    initials: 'VS',
    bgClass: 'bg-orange-500',
  },
];

export default function ReviewsSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  const goTo = (index: number) => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(index);
      setVisible(true);
    }, 200);
  };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      goTo((current + 1) % reviews.length);
    }, 4500);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, current]);

  const prev = () => goTo((current - 1 + reviews.length) % reviews.length);
  const next = () => goTo((current + 1) % reviews.length);

  const r = reviews[current];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          What our customers say
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10">
          Real reviews from verified WashHub users.
        </p>

        <div
          className="relative px-6"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Card */}
          <div
            className={`bg-gray-50 border border-gray-100 rounded-2xl p-8 shadow-md flex flex-col gap-5 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled={i < r.rating} />
              ))}
            </div>

            {/* Quote mark + text */}
            <div className="relative">
              <QuoteIcon className="absolute -top-1 -left-1 text-aqua-200 w-7 h-7" />
              <p className="text-gray-700 text-base leading-relaxed pl-7">
                {r.text}
              </p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
              <div
                className={`w-10 h-10 rounded-full ${r.bgClass} text-white flex items-center justify-center font-bold text-sm flex-shrink-0`}
              >
                {r.initials}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{r.name}</div>
                <div className="text-xs text-gray-500">
                  {r.service} &middot; {r.location}
                </div>
              </div>
            </div>
          </div>

          {/* Prev arrow */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800"
            aria-label="Previous review"
          >
            <ChevronLeftIcon />
          </button>

          {/* Next arrow */}
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800"
            aria-label="Next review"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'bg-aqua-500 w-6' : 'bg-gray-300 w-2'
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : '#e5e7eb'}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
