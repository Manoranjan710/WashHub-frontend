import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const ABSOLUTE_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// In the browser we ALWAYS talk to the same-origin /api path, which
// next.config.mjs rewrites to the backend (locally → localhost:5000, on Vercel
// → the BACKEND_URL host). Going same-origin keeps the auth cookie first-party,
// so SameSite=Lax works in every browser. Only non-browser contexts (SSR) fall
// back to the absolute URL.
const API_URL = typeof window !== 'undefined' ? '/api' : ABSOLUTE_API;

// withCredentials lets the browser send/receive the httpOnly auth cookies.
// The access token is no longer readable from JS, so there is no request
// interceptor attaching an Authorization header — the cookie travels on its own.
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// On 401 — try the cookie-based refresh once, then logout
let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // A 401 from the auth endpoints themselves means bad credentials / invalid
    // refresh token — not an expired access token. Pass it straight to the
    // caller instead of triggering the refresh-and-redirect flow.
    const isAuthEndpoint = /\/auth\/(login|register|refresh)/.test(originalRequest.url ?? '');

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // The refresh token lives in an httpOnly cookie; the browser sends it
      // automatically (withCredentials). The new access token comes back as a
      // cookie too, so there is no token to read from the response body.
      await api.post('/auth/refresh');
      processQueue(null);

      return api(originalRequest);
    } catch (err) {
      processQueue(err);
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
