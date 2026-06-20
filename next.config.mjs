/** @type {import('next').NextConfig} */

// When BACKEND_URL is set (e.g. on Vercel), proxy all /api/* requests to the
// backend server-side. The browser only ever sees the frontend's own origin,
// so the auth cookie the backend sets comes back as a FIRST-PARTY cookie on
// this domain — SameSite=Lax then works in every browser (no third-party
// cookie blocking from Safari/Firefox/incognito).
//
// Set on the frontend host (Vercel):
//   BACKEND_URL=https://washhub-backend.onrender.com   (server-side only, no NEXT_PUBLIC_)
//   NEXT_PUBLIC_API_URL=/api                            (so axios calls the same origin)
//
// Locally, BACKEND_URL is unset, so no rewrite is added and axios talks to the
// backend directly via NEXT_PUBLIC_API_URL (http://localhost:5000/api).
const backendUrl = process.env.BACKEND_URL;

const nextConfig = {
  async rewrites() {
    if (!backendUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
