/**
 * Vercel Edge Middleware: `vercel.json` rewrites cannot safely put multi-segment
 * paths in `?slug=$1` (a raw `/` truncates the query). We rewrite `/api/**`
 * to `/api/router` with `slug` built via URLSearchParams (encodes `/` as %2F).
 */
import { next, rewrite } from '@vercel/edge';

export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/router') {
    return next();
  }
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  const slug = url.pathname.slice(5).replace(/\/+$/, '');
  if (!slug) {
    return next();
  }

  const dest = new URL('/api/router', url.origin);
  dest.searchParams.set('slug', slug);
  url.searchParams.forEach((value, key) => {
    dest.searchParams.set(key, value);
  });

  return rewrite(dest);
}
