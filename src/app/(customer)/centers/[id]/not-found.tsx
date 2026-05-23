import Link from 'next/link';

export default function CenterNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold text-deepsea-600 mb-3">Center Not Found</h1>
      <p className="text-gray-500 mb-8">
        This car wash center doesn&apos;t exist or may have been removed.
      </p>
      <Link
        href="/centers"
        className="bg-aqua-500 hover:bg-aqua-600 text-white font-medium px-6 py-3 rounded-xl transition-colors"
      >
        Browse All Centers
      </Link>
    </div>
  );
}
