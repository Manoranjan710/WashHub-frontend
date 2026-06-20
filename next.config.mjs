/** @type {import('next').NextConfig} */

// Proxy all /api/* requests to the backend server-side. The browser only ever
// sees the frontend's own origin, so the auth cookie the backend sets comes
// back as a FIRST-PARTY cookie on this domain — SameSite=Lax then works in
// every browser (no third-party cookie blocking from Safari/Firefox/incognito).
//
// On Vercel, set BACKEND_URL=https://washhub-backend.onrender.com (server-side
// only, no NEXT_PUBLIC_ prefix, no /api suffix). Locally it defaults to the dev
// backend, so the same-origin /api path works in dev too.
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
