import { z } from 'zod';
import { db, identity, active, json } from '../../lib/server';
import { clientSectionAllowed } from '../../lib/client-access';
import { capabilities } from '../../lib/offers';
import { digest, sameOrigin } from '../../lib/commerce';
import { readValidatedJSON, inputErrorResponse } from '../../lib/api-validation';
import { visitSources } from '../../lib/metric-links';
const input = z
  .object({ profile: z.string().min(1).max(128), source: z.enum(visitSources) })
  .strict();
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return new Response(null, { status: 403 });
    const body = await readValidatedJSON(req, input, 1000);
    if (
      /bot|crawler|spider|preview|facebookexternalhit|whatsapp|headless/i.test(
        req.headers.get('user-agent') || '',
      )
    )
      return new Response(null, { status: 204 });
    const profile: any = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(body.profile)
      .first();
    if (
      !profile ||
      !active(profile) ||
      !capabilities(profile).activity ||
      !clientSectionAllowed(profile, 'requests')
    )
      return new Response(null, { status: 204 });
    const { user, admin } = await identity();
    if (admin || user?.userId === profile.owner) return new Response(null, { status: 204 });
    const now = new Date().toISOString(),
      day = now.slice(0, 10),
      bucket = Math.floor(Date.now() / 1800000);
    // Short-lived irreversible fingerprint; no raw IP, user agent or persistent visitor identifier.
    const hash = await digest(
      [profile.id, body.source, bucket, req.headers.get('cf-connecting-ip') || 'unknown'].join('|'),
    );
    await db().batch([
      db()
        .prepare(
          'INSERT INTO profile_metrics(profile,day,source,visits) SELECT ?,?,?,1 WHERE NOT EXISTS(SELECT 1 FROM profile_metric_seen WHERE id=?) ON CONFLICT(profile,day,source) DO UPDATE SET visits=visits+1',
        )
        .bind(profile.id, day, body.source, hash),
      db()
        .prepare('INSERT OR IGNORE INTO profile_metric_seen(id,profile,created) VALUES(?,?,?)')
        .bind(hash, profile.id, now),
    ]);
    await db()
      .prepare(
        'DELETE FROM profile_metric_seen WHERE id IN (SELECT id FROM profile_metric_seen WHERE created<? LIMIT 100)',
      )
      .bind(new Date(Date.now() - 3600000).toISOString())
      .run();
    return new Response(null, { status: 204 });
  } catch (error) {
    return inputErrorResponse(error) || new Response(null, { status: 503 });
  }
}
export async function GET() {
  try {
    const { user } = await identity();
    if (!user) return json({ error: 'Connexion requise' }, 401);
    const profile: any = await db()
      .prepare('SELECT * FROM profiles WHERE owner=?')
      .bind(user.userId)
      .first();
    if (
      !profile ||
      !active(profile) ||
      !capabilities(profile).activity ||
      !clientSectionAllowed(profile, 'requests')
    )
      return json({ error: 'Accès refusé' }, 403);
    const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const rows = await db()
      .prepare(
        'SELECT day,source,visits FROM profile_metrics WHERE profile=? AND day>=? ORDER BY day',
      )
      .bind(profile.id, since)
      .all();
    return json({ days: 30, since, rows: rows.results });
  } catch {
    return json(
      { error: 'Statistiques indisponibles', errorAr: 'الإحصائيات ما متوفراش دابا.' },
      503,
    );
  }
}
