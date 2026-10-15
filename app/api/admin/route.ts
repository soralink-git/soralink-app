import { adminActionSchema, readValidatedJSON, inputErrorResponse } from '../../lib/api-validation';
import { db, json, identity, log } from '../../lib/server';
export async function GET() {
  try {
    const { user, admin } = await identity();
    if (!user) return json({ error: 'Connexion requise' }, 401);
    if (!admin)
      return json(
        { error: 'Connectez-vous avec le compte SoraLink autorisé pour l’administration.' },
        403,
      );
    const [profiles, orders, audit] = await Promise.all([
      db()
        .prepare(
          'SELECT id,email,state,plan,expires,pro_enabled,published,data,updated FROM profiles ORDER BY updated DESC',
        )
        .all(),
      db()
        .prepare(
          'SELECT orders.*,profiles.email,profiles.data FROM orders LEFT JOIN profiles ON profiles.owner=orders.owner ORDER BY orders.created DESC',
        )
        .all(),
      db().prepare('SELECT * FROM audit ORDER BY created DESC LIMIT 50').all(),
    ]);
    return json({ profiles: profiles.results, orders: orders.results, audit: audit.results });
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Administration indisponible' }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (req.headers.get('origin') !== new URL(req.url).origin)
      return json({ error: 'Accès refusé' }, 403);
    const { user, admin } = await identity();
    if (!user || !admin) return json({ error: 'Accès refusé' }, 403);
    const b = await readValidatedJSON(req, adminActionSchema, 10000);
    if (b.action === 'profile') {
      if (b.state !== 'suspended' && !b.expires)
        return json({ error: 'Renseignez une échéance pour activer ce profil.' }, 400);
      const expires = b.expires ? new Date(b.expires + 'T23:59:59Z').toISOString() : null;
      await db()
        .prepare('UPDATE profiles SET state=?,plan=?,expires=?,pro_enabled=? WHERE id=?')
        .bind(b.state, b.plan, expires, b.pro ? 1 : 0, b.id)
        .run();
      await log(user.email, 'Profil : ' + b.state + ' / ' + b.plan, b.id);
      return json({ ok: true });
    }
    if (b.action === 'order') {
      await db().prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status, b.id).run();
      await log(user.email, 'Commande : ' + b.status, b.id);
      return json({ ok: true });
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Modification impossible' }, 503);
  }
}
