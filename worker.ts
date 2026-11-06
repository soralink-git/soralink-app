import handler from 'vinext/server/fetch-handler';
import { mailEnabled, mailReady, sendPending } from './app/lib/notifications';
import { normalizePublicName, publicNameError } from './app/lib/public-address';
import { readPublicProfile } from './app/lib/public-profile-lookup';
import { active } from './app/lib/subscription';

const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

// Report-only first: collecting violations must not break the live site.
// Promote to Content-Security-Policy once the inline theme/RSC scripts use nonces.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://*.supabase.co https://static.cloudflareinsights.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function secure(response: Response, status?: number) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS))
    if (!headers.has(name)) headers.set(name, value);
  if (!headers.has('Content-Security-Policy-Report-Only'))
    headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY);
  if (status && status !== response.status) {
    return new Response(response.body, { status, statusText: 'Not Found', headers });
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// The public card page streams its shell before D1 resolves, so notFound()
// alone can still be sent with a 200 on Cloudflare. Resolve the route up front
// and correct the status before the response leaves the Worker.
async function publicRouteExists(pathname: string): Promise<boolean | null> {
  const card = /^\/c\/([^/]+)$/.exec(pathname);
  if (card) {
    let id = card[1];
    try {
      id = decodeURIComponent(id);
    } catch {
      return false;
    }
    const profile = await readPublicProfile({ id });
    return !!profile && active(profile);
  }
  if (!/^\/[^/]+$/.test(pathname)) return null;
  let raw = pathname.slice(1);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  // Static files served through the Worker are not profile routes.
  if (/\.[a-z0-9]{1,8}$/i.test(raw)) return null;
  const name = normalizePublicName(raw);
  // Reserved application paths are handled by their own routes.
  if (publicNameError(name)) return null;
  const profile = await readPublicProfile({ name });
  return !!profile && active(profile);
}

function wantsHtml(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  if (request.headers.get('rsc') === '1') return false;
  const accept = request.headers.get('accept');
  // No Accept header or a wildcard still means a page may be served; a client
  // asking explicitly for JSON or another type must not hit the profile lookup.
  return !accept || /\btext\/html\b/.test(accept) || accept.includes('*/*');
}

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    // One canonical host: www is served by Pages but must not duplicate the site.
    if (url.hostname === 'www.soralink.link') {
      const target = new URL(request.url);
      target.hostname = 'soralink.link';
      return Response.redirect(target.toString(), 301);
    }
    if (
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      [
        '/favicon.svg',
        '/manifest.webmanifest',
        '/sw.js',
        '/offline.html',
        '/offline',
        '/og-soralink.png',
        '/demo-design.svg',
      ].includes(url.pathname)
    )
      return secure(await env.ASSETS.fetch(request));
    let routeExists: boolean | null = null;
    if (wantsHtml(request) && env.DB) {
      try {
        routeExists = await publicRouteExists(url.pathname);
      } catch {
        // A storage error must surface as the page's own 5xx, not as a 404.
        routeExists = null;
      }
    }
    const response = await handler.fetch(request, env, ctx);
    if (
      request.method === 'POST' &&
      ['/api/data', '/api/catalog-order'].includes(url.pathname) &&
      response.ok &&
      env.DB &&
      mailEnabled({ ...env, DB: env.DB }) &&
      (env.NOTIFICATIONS || mailReady({ ...env, DB: env.DB }))
    ) {
      // One bounded send fits the post-response lifetime; cron drains retries/backlogs.
      ctx.waitUntil(
        (env.NOTIFICATIONS
          ? env.NOTIFICATIONS.fetch('https://notifications.internal/dispatch', {
              method: 'POST',
            }).then((result) => {
              if (!result.ok) throw Error('Notification dispatcher unavailable');
            })
          : sendPending({ ...env, DB: env.DB }, fetch, 1)
        ).catch(() => {
          console.error('soralink_notifications_dispatch_failed');
        }),
      );
    }
    const notFound =
      routeExists === false &&
      response.status === 200 &&
      (response.headers.get('content-type') || '').includes('text/html');
    const secured = secure(response, notFound ? 404 : undefined);
    // *.pages.dev duplicates the production site: keep it out of search indexes.
    if (url.hostname.endsWith('.pages.dev')) secured.headers.set('X-Robots-Tag', 'noindex');
    return secured;
  },
};
