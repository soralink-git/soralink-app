import handler from 'vinext/server/fetch-handler';
import { mailEnabled, mailReady, sendPending } from './app/lib/notifications';
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
        '/offline',
        '/og-soralink.png',
        '/demo-design.svg',
      ].includes(url.pathname)
    )
      return env.ASSETS.fetch(request);
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
    return response;
  },
};
