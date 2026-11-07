import { env } from 'cloudflare:workers';

// Provider-level failures only: a mistyped recipient (4xx on one address) must
// not raise an infrastructure alert.
const PROVIDER_ERRORS = "('provider_http_401','provider_http_403','network_error')";

export async function GET() {
  const started = Date.now();
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  let database = 'ok';
  let email = 'ok';
  let failedEmails24h = 0;
  try {
    if (!env.DB) database = 'missing';
    else {
      await env.DB.prepare('SELECT 1').first();
      try {
        const row: any = await env.DB.prepare(
          `SELECT count(*) AS failed, sum(CASE WHEN error IN ${PROVIDER_ERRORS} THEN 1 ELSE 0 END) AS provider
           FROM notifications WHERE state='failed' AND created >= ?`,
        )
          .bind(dayAgo)
          .first();
        failedEmails24h = Number(row?.failed) || 0;
        if (Number(row?.provider) > 0) email = 'failing';
      } catch {
        // Missing table on a fresh database: the mail state is simply unknown.
        email = 'unknown';
      }
    }
  } catch {
    database = 'error';
  }
  const healthy = database === 'ok';
  return Response.json(
    {
      status: healthy ? 'ok' : 'degraded',
      database,
      email,
      failedEmails24h,
      ms: Date.now() - started,
      time: new Date().toISOString(),
    },
    {
      // A failing mail provider does not make the site unavailable; the uptime
      // workflow reads `email` and raises its own incident.
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
