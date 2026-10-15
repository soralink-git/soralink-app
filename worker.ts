import handler from 'vinext/server/fetch-handler';
import { mailReady, sendPending } from './app/lib/notifications';
export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      [
        '/favicon.svg',
        '/manifest.webmanifest',
        '/sw.js',
        '/offline.html',
        '/og-soralink.png',
        '/demo-design.svg',
      ].includes(url.pathname)
    )
      return env.ASSETS.fetch(request);
    const response = await handler.fetch(request, env, ctx);
    if (
      request.method === 'POST' &&
      url.pathname === '/api/data' &&
      response.ok &&
      env.DB &&
      mailReady({ ...env, DB: env.DB })
    ) {
      // One bounded send fits the post-response lifetime; cron drains retries/backlogs.
      ctx.waitUntil(
        sendPending({ ...env, DB: env.DB }, fetch, 1).catch(() => {
          console.error('soralink_notifications_dispatch_failed');
        }),
      );
    }
    return response;
  },
};
