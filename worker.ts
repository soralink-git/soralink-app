import handler from 'vinext/server/fetch-handler';
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
    return handler.fetch(request, env, ctx);
  },
};
