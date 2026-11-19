type AuthEnv = { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };

// Probe the same Auth project and key used by sign-in, without creating an
// account, sending mail or recording any user credentials.
export async function authHealth(e: AuthEnv, probe: typeof fetch = fetch) {
  if (!e.SUPABASE_URL || !e.SUPABASE_PUBLISHABLE_KEY) return 'missing';
  try {
    const url = new URL('/auth/v1/settings', e.SUPABASE_URL);
    if (url.protocol !== 'https:') return 'failing';
    const response = await probe(url, {
      headers: { apikey: e.SUPABASE_PUBLISHABLE_KEY },
      redirect: 'manual',
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return 'failing';
    const settings: { external?: { email?: boolean } } = await response.json();
    return settings.external?.email === true ? 'ok' : 'failing';
  } catch {
    return 'failing';
  }
}

export async function storageHealth(bucket?: Pick<R2Bucket, 'head'>) {
  if (!bucket) return 'missing';
  try {
    // A missing object is a successful, read-only R2 operation.
    await bucket.head('_soralink_health_probe');
    return 'ok';
  } catch {
    return 'failing';
  }
}
