import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-aqua-500 to-deepsea-600 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Find & Book Car Washes<br />Near You
            </h1>
            <p className="text-arctic-100 text-lg mb-8 max-w-xl mx-auto">
              Compare prices, read reviews, and book a slot at the best car wash centers in your city — in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/centers"
                className="px-8 py-3 bg-white text-deepsea-600 font-semibold rounded-xl hover:bg-arctic-50 transition-colors"
              >
                Find Centers
              </Link>
              <Link
                href="/register?role=vendor"
                className="px-8 py-3 bg-aqua-400 text-white font-semibold rounded-xl hover:bg-aqua-300 transition-colors border border-aqua-400"
              >
                List Your Center
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Find nearby centers', desc: 'Allow location access and instantly see car wash centers sorted by distance.' },
                { step: '2', title: 'Pick a slot', desc: 'Choose your service, date, and time. Real-time availability updates every 30 seconds.' },
                { step: '3', title: 'Pay & go', desc: 'Pay securely via UPI, card, or wallet. Get a confirmation email instantly.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-arctic-100 text-deepsea-600 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vendor CTA */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Own a car wash center?</h2>
            <p className="text-gray-500 mb-6">
              Join WashHub to reach more customers, manage bookings digitally, and get weekly AI insights on your business.
            </p>
            <Link
              href="/register?role=vendor"
              className="inline-block px-8 py-3 bg-aqua-500 text-white font-semibold rounded-xl hover:bg-aqua-600 transition-colors"
            >
              Register Your Center
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
