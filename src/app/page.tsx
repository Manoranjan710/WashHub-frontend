import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReviewsSlider from '@/components/home/ReviewsSlider';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1">

        {/* ── Hero ── */}
        <section
          className="relative text-white py-24 px-4 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg_hero.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-deepsea-700/85 to-deepsea-500/75" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <ScrollReveal direction="up" delay={0}>
              <span className="inline-block px-4 py-1.5 bg-aqua-400/20 border border-aqua-400/40 rounded-full text-aqua-200 text-sm font-medium mb-6 tracking-wide">
                India&apos;s #1 Car Wash Marketplace
              </span>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={120}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
                Find &amp; Book Car Washes<br />Near You
              </h1>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={240}>
              <p className="text-arctic-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Compare prices, read reviews, and book a slot at the best car wash centers in your city — in under 2 minutes.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={360}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/centers"
                  className="px-8 py-3.5 bg-white text-deepsea-600 font-semibold rounded-xl hover:bg-arctic-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Find Centers Near Me
                </Link>
                <Link
                  href="/register?role=vendor"
                  className="px-8 py-3.5 bg-aqua-400/20 border border-aqua-400/50 text-white font-semibold rounded-xl hover:bg-aqua-400/30 transition-all backdrop-blur-sm"
                >
                  List Your Center
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="bg-deepsea-600 text-white py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center divide-x divide-deepsea-500">
              {[
                { value: '50+',   label: 'Active Centers',  delay: 0   },
                { value: '10K+',  label: 'Bookings Done',   delay: 100 },
                { value: '4.8★',  label: 'Avg. Rating',     delay: 200 },
                { value: '2 min', label: 'To Book a Slot',  delay: 300 },
              ].map((stat) => (
                <ScrollReveal key={stat.label} direction="up" delay={stat.delay} className="px-4">
                  <div className="text-2xl font-bold text-aqua-300">{stat.value}</div>
                  <div className="text-sm text-deepsea-100 mt-0.5">{stat.label}</div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">How it works</h2>
              <p className="text-center text-gray-500 text-sm mb-10 max-w-md mx-auto">
                Book a professional car wash in three simple steps — no calls, no queues.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  icon: <LocationIcon />,
                  title: 'Find nearby centers',
                  desc: 'Allow location access and instantly see car wash centers sorted by distance.',
                  delay: 0,
                },
                {
                  step: '2',
                  icon: <CalendarIcon />,
                  title: 'Pick a slot',
                  desc: 'Choose your service, date, and time. Real-time availability updates every 30 seconds.',
                  delay: 120,
                },
                {
                  step: '3',
                  icon: <CardIcon />,
                  title: 'Pay & go',
                  desc: 'Pay securely via UPI, card, or wallet. Get a confirmation email instantly.',
                  delay: 240,
                },
              ].map((item) => (
                <ScrollReveal key={item.step} direction="up" delay={item.delay}>
                  <div className="relative bg-white border border-gray-100 rounded-2xl p-7 shadow-md hover:shadow-lg transition-shadow text-center h-full">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-aqua-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 bg-arctic-50 rounded-xl flex items-center justify-center mx-auto mb-4 mt-1 text-aqua-500">
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why WashHub ── */}
        <section className="py-16 px-4 bg-[#4edcf56b]">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Why WashHub?</h2>
              <p className="text-center text-gray-500 text-sm mb-10 max-w-md mx-auto">
                Everything you need for a hassle-free car wash experience.
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  icon: <SearchIcon />,
                  title: 'Compare & Choose',
                  desc: 'Browse verified centers by distance, rating, and price to find your perfect match.',
                  delay: 0,
                },
                {
                  icon: <BoltIcon />,
                  title: 'Real-time Slots',
                  desc: 'Live availability updated every 30 seconds. Zero overbooking, zero surprises.',
                  delay: 100,
                },
                {
                  icon: <ShieldIcon />,
                  title: 'Secure Payments',
                  desc: 'Pay via UPI, card, or wallet powered by Razorpay. Fully encrypted and safe.',
                  delay: 200,
                },
                {
                  icon: <MailIcon />,
                  title: 'Instant Confirmation',
                  desc: 'Email confirmation the moment you book, plus a 2-hour reminder before your slot.',
                  delay: 300,
                },
              ].map((feat) => (
                <ScrollReveal key={feat.title} direction="up" delay={feat.delay}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="w-10 h-10 bg-arctic-50 rounded-lg flex items-center justify-center text-aqua-500 mb-3">
                      {feat.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{feat.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Reviews Slider ── */}
        <ScrollReveal direction="up">
          <ReviewsSlider />
        </ScrollReveal>

        {/* ── Vendor CTA ── */}
        <section className="py-16 px-4 bg-deepsea-700">
          <div className="max-w-3xl mx-auto text-center text-white">
            <ScrollReveal direction="up" delay={0}>
              <div className="inline-flex items-center gap-2 bg-aqua-400/20 border border-aqua-400/30 rounded-full px-4 py-1.5 text-aqua-300 text-sm font-medium mb-6">
                <StorefrontIcon />
                For Business Owners
              </div>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={120}>
              <h2 className="text-2xl font-bold mb-3">Own a car wash center?</h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={240}>
              <p className="text-deepsea-100 mb-8 max-w-xl mx-auto leading-relaxed text-sm">
                Join WashHub to reach more customers, manage bookings digitally, and get weekly AI insights on your business performance — all from one dashboard.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={360}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register?role=vendor"
                  className="inline-block px-8 py-3.5 bg-aqua-400 text-white font-semibold rounded-xl hover:bg-aqua-300 transition-colors shadow-lg"
                >
                  Register Your Center
                </Link>
                <Link
                  href="/centers"
                  className="inline-block px-8 py-3.5 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
                >
                  Browse All Centers
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

/* ── inline SVG icon components ── */

function LocationIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function StorefrontIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
