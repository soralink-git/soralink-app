import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { IDLE_TIMEOUT_MS, SESSION_COOKIE } from './idle-policy';
function sessionDB() {
  if (!env.DB) throw new Error('Storage unavailable');
  return env.DB;
}
async function tokenId(token: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))),
    (b) => b.toString(16).padStart(2, '0'),
  ).join('');
}
async function currentId() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value && /^[a-f0-9]{64}$/.test(value) ? tokenId(value) : null;
}
export async function activeAppSession() {
  const id = await currentId();
  if (!id) return null;
  return sessionDB()
    .prepare('SELECT id, owner, expires FROM app_sessions WHERE id=? AND expires>?')
    .bind(id, Date.now())
    .first<{ id: string; owner: string; expires: number }>();
}
export async function endAppSession() {
  const id = await currentId();
  if (id) await sessionDB().prepare('DELETE FROM app_sessions WHERE id=?').bind(id).run();
  (await cookies()).set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
export async function startAppSession(owner: string) {
  await endAppSession();
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  const expires = Date.now() + IDLE_TIMEOUT_MS;
  await sessionDB()
    .prepare(
      'DELETE FROM app_sessions WHERE id IN (SELECT id FROM app_sessions WHERE expires<=? LIMIT 200)',
    )
    .bind(Date.now())
    .run();
  await sessionDB()
    .prepare('INSERT INTO app_sessions(id,owner,expires) VALUES(?,?,?)')
    .bind(await tokenId(token), owner, expires)
    .run();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 * 7,
  });
  return expires;
}
export async function renewAppSession(owner: string) {
  const id = await currentId();
  if (!id) return null;
  const now = Date.now();
  // The condition prevents delayed/background requests from reviving an expired session.
  return sessionDB()
    .prepare(
      'UPDATE app_sessions SET expires=? WHERE id=? AND owner=? AND expires>? RETURNING expires',
    )
    .bind(now + IDLE_TIMEOUT_MS, id, owner, now)
    .first<{ expires: number }>();
}
