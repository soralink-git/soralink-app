import { env } from 'cloudflare:workers';
import { currentPublicName } from '../address-storage';
import { dataQuerySchema, validateInput } from '../api-validation';
import { catalogRights } from '../catalog-menu';
import { clientSectionAllowed } from '../client-access';
import { contactCard } from '../contact-card';
import { readHistory, requestNotifications } from '../history';
import { mailEnabled } from '../notifications';
import { capabilities } from '../offers';
import { publicCardData } from '../public-card';
import { active, db, identity, json } from '../server';
export async function readData(req: Request) {
  const query = validateInput(dataQuerySchema, Object.fromEntries(new URL(req.url).searchParams));
  const { user, admin, source } = await identity();
  if (query.exchange === '1') {
    if (!user) return json({ error: 'Connexion requise' }, 401);
    const own: any = await db()
      .prepare('SELECT * FROM profiles WHERE owner=?')
      .bind(user.userId)
      .first();
    return json({ card: own && active(own) ? contactCard(own) : null });
  }
  const id = query.id;
  if (id) {
    const p: any = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(id)
      .first();
    if (!p || !active(p)) return json({ error: 'Page indisponible' }, 404);
    const d = publicCardData(
      JSON.parse(p.data),
      !!capabilities(p).appointments,
      catalogRights(p),
      capabilities(p),
    );
    return json({
      id: p.id,
      publicName: await currentPublicName(db(), p.id),
      data: JSON.stringify(d),
    });
  }
  if (!user) return json({ error: 'Connexion requise' }, 401);
  const p: any = await db()
    .prepare('SELECT * FROM profiles WHERE owner=?')
    .bind(user.userId)
    .first();
  if (query.history) {
    if (
      query.history !== 'orders' &&
      !clientSectionAllowed(p, query.history === 'contacts' ? 'contacts' : 'requests')
    )
      return json(
        {
          error: 'Le suivi nécessite le pack Suivi de mon activité.',
          errorAr: 'التتبّع خاصو باقة تتبّع النشاط.',
        },
        403,
      );
    const page = await readHistory(db(), user.userId, p?.id, query.history, query.cursor);
    return json({
      items: page.items,
      nextCursor: page.nextCursor,
      notifications:
        query.history === 'requests'
          ? await requestNotifications(db(), p?.id, page.items as { id: string }[])
          : [],
    });
  }
  if (p) {
    p.publicName = await currentPublicName(db(), p.id);
    p.catalogRights = catalogRights(p);
    await db().prepare('UPDATE profiles SET email=? WHERE id=?').bind(user.email, p.id).run();
    const d = JSON.parse(p.data);
    d.pro = capabilities(p).appointments;
    d.activity = capabilities(p).activity;
    p.data = JSON.stringify(d);
  }
  const histories = ['requests', 'contacts', 'orders'] as const;
  const pages = await Promise.all(
    histories.map((kind) =>
      kind !== 'orders' && !clientSectionAllowed(p, kind === 'contacts' ? 'contacts' : 'requests')
        ? Promise.resolve({ items: [], nextCursor: null })
        : readHistory(db(), user.userId, p?.id, kind),
    ),
  );
  const [inbox, contacts, orders] = pages;
  const notifications = await requestNotifications(db(), p?.id, inbox.items as { id: string }[]);
  return json({
    profile: p,
    requests: inbox.items,
    contacts: contacts.items,
    notifications,
    mailConfigured: mailEnabled(env as any),
    orders: orders.items,
    pages: Object.fromEntries(
      histories.map((kind, i) => [kind, { nextCursor: pages[i].nextCursor }]),
    ),
    user: user.displayName,
    email: user.email,
    saveOwner: user.userId,
    admin,
    source,
  });
}
