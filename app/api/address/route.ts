import { identity, db, json } from '../../lib/server';
import { normalizePublicName, publicNameError } from '../../lib/public-address';
import { reservePublicName } from '../../lib/address-storage';
import { readValidatedJSON, inputErrorResponse } from '../../lib/api-validation';
import { z } from 'zod';
const schema = z.object({ name: z.string().max(80) }).strict();
export async function GET(request: Request) {
  try {
    const { user } = await identity();
    if (!user) return json({ error: 'auth' }, 401);
    const name = normalizePublicName(new URL(request.url).searchParams.get('name'));
    const invalid = publicNameError(name);
    if (invalid) return json({ name, error: invalid }, 400);
    const existing = await db()
      .prepare(
        'SELECT a.profile,p.owner FROM profile_addresses a JOIN profiles p ON p.id=a.profile WHERE a.name=?',
      )
      .bind(name)
      .first<{ profile: string; owner: string }>();
    return json({ name, available: !existing || existing.owner === user.userId });
  } catch {
    return json({ error: 'service' }, 503);
  }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return json({ error: 'origin' }, 403);
    const { user } = await identity();
    if (!user) return json({ error: 'auth' }, 401);
    const body = await readValidatedJSON(request, schema);
    const name = normalizePublicName(body.name);
    const invalid = publicNameError(name);
    if (invalid) return json({ error: invalid }, 400);
    const profile = await db()
      .prepare('SELECT id FROM profiles WHERE owner=?')
      .bind(user.userId)
      .first<{ id: string }>();
    if (!profile) return json({ error: 'save-first' }, 409);
    if (!(await reservePublicName(db(), user.userId, profile.id, name)))
      return json({ error: 'taken' }, 409);
    return json({ ok: true, name });
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return json({ error: 'format' }, 400);
    return json({ error: 'service' }, 503);
  }
}
