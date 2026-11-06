// Fixed-window counter stored in D1. The key already contains the action and the
// window start, so one row per window and no read-modify-write race.
export async function allowRequest(
  database: D1Database,
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const row: any = await database
    .prepare(
      'INSERT INTO public_rate_limits(key,hits,expires) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits',
    )
    .bind(key + ':' + windowStart, 1, windowStart + windowMs)
    .first();
  // Bounded cleanup: expired windows are never read again.
  await database
    .prepare(
      'DELETE FROM public_rate_limits WHERE key IN (SELECT key FROM public_rate_limits WHERE expires < ? LIMIT 50)',
    )
    .bind(now)
    .run();
  return (Number(row?.hits) || 1) <= limit;
}

export async function verifyTurnstile(
  secret: string | undefined,
  token: string | undefined,
  ip?: string,
  send: typeof fetch = globalThis.fetch,
) {
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const response = await send('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal:
        typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(10000)
          : undefined,
    });
    const result: any = await response.json();
    return result?.success === true;
  } catch {
    return false;
  }
}
