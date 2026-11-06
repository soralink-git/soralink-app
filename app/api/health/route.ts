import { env } from 'cloudflare:workers';

// Public, read-only probe used by the uptime workflow. No secret, no user data.
export async function GET() {
  const started = Date.now();
  let database = 'ok';
  try {
    if (!env.DB) database = 'missing';
    else await env.DB.prepare('SELECT 1').first();
  } catch {
    database = 'error';
  }
  const healthy = database === 'ok';
  return Response.json(
    {
      status: healthy ? 'ok' : 'degraded',
      database,
      ms: Date.now() - started,
      time: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
