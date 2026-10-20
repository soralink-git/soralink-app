import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getChatGPTUser } from '../chatgpt-auth';
import { authClient } from './supabase';
import { activeAppSession } from './idle-session';
export function db() {
  if (!env.DB) throw new Error('Storage unavailable');
  return env.DB;
}
export function isAdministrator(email?: string | null) {
  return (
    !!email &&
    !!env.SORATAP_ADMIN_EMAIL &&
    email.toLowerCase() === env.SORATAP_ADMIN_EMAIL.toLowerCase()
  );
}
export async function identity() {
  const session = await activeAppSession();
  if (!session) return { user: null, source: '', admin: false, expiresAt: null };
  let user: { userId: string; email: string; displayName: string } | null = null;
  let source = '';
  if (env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY) {
    const s = await authClient();
    const { data, error } = await s.auth.getUser();
    if (!error && data.user?.email && data.user.email_confirmed_at) {
      const email = data.user.email.toLowerCase();
      const owner = 'sb:' + data.user.id;
      user = { userId: owner, email, displayName: email };
      source = 'email';
      // Ownership is bound to the verified user ID, never reclaimed by email.
    }
  }
  if (!user && (await cookies()).get('soratap_legacy')?.value === '1') {
    user = await getChatGPTUser();
    if (user) source = 'chatgpt';
  }
  if (user?.userId !== session.owner)
    return { user: null, source: '', admin: false, expiresAt: null };
  return {
    expiresAt: session.expires,
    user,
    source,
    admin: !!user && isAdministrator(user.email),
  };
}
export const json = (v: unknown, s = 200) =>
  Response.json(v, { status: s, headers: { 'Cache-Control': 'no-store' } });
export { active } from './subscription';
export async function log(actor: string, action: string, target: string) {
  await db()
    .prepare('INSERT INTO audit(id,actor,action,target,created) VALUES(?,?,?,?,?)')
    .bind(crypto.randomUUID(), actor, action, target, new Date().toISOString())
    .run();
}
