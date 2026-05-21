import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-bold text-aqua-500">WashHub</span>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} WashHub. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/centers" className="hover:text-aqua-500 transition-colors">Find Centers</Link>
            <Link href="/register?role=vendor" className="hover:text-aqua-500 transition-colors">List Your Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
