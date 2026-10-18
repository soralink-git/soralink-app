import { normalizeAppearance } from '../../lib/personalization';
import { adoptLegacy, validateMedia, saveProfileWithMedia, cleanupMedia } from '../../lib/media-storage';
import { catalogRights } from '../../lib/catalog-menu';
import { readPage } from '../../lib/pagination';
import {
  adminActionSchema,
  adminQuerySchema,
  validateInput,
  readValidatedJSON,
  inputErrorResponse,
} from '../../lib/api-validation';
import { db, json, identity, log } from '../../lib/server';
export async function GET(req: Request) {
  try {
    const { user, admin } = await identity();
    if (!user) return json({ error: 'Connexion requise' }, 401);
    if (!admin)
      return json(
        { error: 'Connectez-vous avec le compte SoraLink autorisé pour l’administration.' },
        403,
      );
    const query = validateInput(
      adminQuerySchema,
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const sections = ['profiles', 'orders', 'audit'] as const;
    const empty = { items: [], nextCursor: null };
    const pages = await Promise.all(
      sections.map(async (section) => {
        if (query.section && section !== query.section) return empty;
        const cursor = query.section === section ? query.cursor : undefined;
        if (section === 'profiles') {
          // instr treats %, _ and quotes literally and keeps the search parameterized.
          return readPage(
            db(),
            'SELECT id,email,state,plan,expires,pro_enabled,published,data,updated,catalog_rights FROM profiles',
            "(?='' OR instr(lower(coalesce(email,'')),lower(?))>0 OR instr(lower(coalesce(json_extract(data,'$.name'),'')),lower(?))>0)",
            [query.search, query.search, query.search],
            cursor,
            'updated',
          );
        }
        if (section === 'orders')
          return readPage(
            db(),
            'SELECT orders.*,profiles.email,profiles.data FROM orders LEFT JOIN profiles ON profiles.owner=orders.owner',
            '1=1',
            [],
            cursor,
            'orders.created',
            'orders.id',
          );
        return readPage(db(), 'SELECT * FROM audit', '1=1', [], cursor);
      }),
    );
    const [profiles, orders, audit] = pages;
    const stats = await db()
      .prepare(
        `SELECT
      (SELECT COUNT(*) FROM profiles) AS clients,
      (SELECT COUNT(*) FROM orders WHERE status='pending') AS pendingOrders,
      (SELECT COUNT(*) FROM profiles WHERE expires IS NOT NULL AND expires < ?) AS expired`,
      )
      .bind(new Date().toISOString())
      .first();
    return json({
      profiles: profiles.items.map((p: any) => ({ ...p, catalogRights: catalogRights(p) })),
      orders: orders.items,
      audit: audit.items,
      stats,
      pages: Object.fromEntries(
        sections.map((section, i) => [section, { nextCursor: pages[i].nextCursor }]),
      ),
    });
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
    if (b.action === 'design') {
      const profile: any = await db().prepare('SELECT * FROM profiles WHERE id=?').bind(b.id).first();
      if (!profile) return json({error:'Profil introuvable', errorAr:'ما لقيناش الكارط.'},404);
      if (b.revision !== profile.updated) return json({error:'Cette carte a changé. Fermez puis rouvrez ses réglages.',errorAr:'الكارط تبدلات. سدّ الإعدادات وعاود حلّهم.'},409);
      const old = JSON.parse(profile.data);
      const data = normalizeAppearance({...old,...b.settings});
      await adoptLegacy(profile.owner, profile);
      if (!await validateMedia(profile.owner, data, old)) return json({error:'Cette image n’appartient pas à ce client.',errorAr:'هاد التصويرة ماشي ديال هاد الزبون.'},403);
      const revision = new Date(Math.max(Date.now(),(Date.parse(profile.updated)||0)+1)).toISOString();
      if (!await saveProfileWithMedia(profile.owner, profile, profile.id, data, !!profile.published, profile.email || '', revision))
        return json({error:'Cette carte a changé. Rechargez ses réglages.',errorAr:'الكارط تبدلات. عاود حمّل الإعدادات.'},409);
      await cleanupMedia(profile.owner);
      await log(user.email, 'Présentation et sections de la carte', profile.id);
      return json({ok:true, data, revision});
    }
    if (b.action === 'catalogRights') {
      const result = await db()
        .prepare('UPDATE profiles SET catalog_rights=? WHERE id=?')
        .bind(b.rights ? JSON.stringify(b.rights) : null, b.id)
        .run();
      if (!result.meta.changes) return json({ error: 'Profil introuvable' }, 404);
      await log(user.email, 'Droits des produits et services', b.id);
      return json({ ok: true });
    }
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
