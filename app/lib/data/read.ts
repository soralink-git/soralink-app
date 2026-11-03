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
import { profileName } from '../profile-identity';
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
    let p: any = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(id)
      .first();
    if (!p) {
      p = await db()
        .prepare(
          'SELECT s.*, p.plan, p.state, p.expires, p.pro_enabled, p.catalog_rights, p.client_access FROM secondary_cards s JOIN profiles p ON p.owner=s.owner WHERE s.id=? AND s.published=1',
        )
        .bind(id)
        .first();
    }
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
  const secondary: any[] = p
    ? (
        await db()
          .prepare(
            'SELECT id, data, published, updated, created FROM secondary_cards WHERE owner=? ORDER BY created ASC',
          )
          .bind(user.userId)
          .all()
      ).results || []
    : [];
  const targetId = query.cardId;
  const sec = targetId && secondary.find((s) => s.id === targetId);
  const activeProfile: any = sec
    ? {
        id: sec.id,
        owner: user.userId,
        data: sec.data,
        published: sec.published,
        updated: sec.updated,
        email: p.email,
        state: p.state,
        plan: p.plan,
        expires: p.expires,
        pro_enabled: p.pro_enabled,
        catalog_rights: p.catalog_rights,
        client_access: p.client_access,
        card_limit: p.card_limit ?? 1,
      }
    : p;
  if (query.history) {
    if (
      query.history !== 'orders' &&
      !clientSectionAllowed(activeProfile, query.history === 'contacts' ? 'contacts' : 'requests')
    )
      return json(
        {
          error: 'Le suivi nécessite le pack Suivi de mon activité.',
          errorAr: 'التتبّع خاصو باقة تتبّع النشاط.',
        },
        403,
      );
    const page = await readHistory(db(), user.userId, activeProfile?.id, query.history, query.cursor);
    return json({
      items: page.items,
      nextCursor: page.nextCursor,
      notifications:
        query.history === 'requests'
          ? await requestNotifications(db(), activeProfile?.id, page.items as { id: string }[])
          : [],
    });
  }
  if (activeProfile) {
    activeProfile.publicName = await currentPublicName(db(), activeProfile.id);
    activeProfile.catalogRights = catalogRights(activeProfile);
    if (activeProfile.id === p?.id) {
      await db().prepare('UPDATE profiles SET email=? WHERE id=?').bind(user.email, p.id).run();
    }
    const d = JSON.parse(activeProfile.data);
    d.pro = capabilities(activeProfile).appointments;
    d.activity = capabilities(activeProfile).activity;
    activeProfile.data = JSON.stringify(d);
  }
  const histories = ['requests', 'contacts', 'orders'] as const;
  const pages = await Promise.all(
    histories.map((kind) =>
      kind !== 'orders' && !clientSectionAllowed(activeProfile, kind === 'contacts' ? 'contacts' : 'requests')
        ? Promise.resolve({ items: [], nextCursor: null })
        : readHistory(db(), user.userId, activeProfile?.id, kind),
    ),
  );
  const [inbox, contacts, orders] = pages;
  const notifications = await requestNotifications(db(), activeProfile?.id, inbox.items as { id: string }[]);
  const cards = p
    ? [
        {
          id: p.id,
          name: profileName(JSON.parse(p.data)) || '',
          published: !!p.published,
          updated: p.updated,
          isPrimary: true,
          publicName: await currentPublicName(db(), p.id),
        },
        ...(await Promise.all(
          secondary.map(async (s: any) => {
            let name = '';
            try {
              name = profileName(JSON.parse(s.data)) || '';
            } catch {}
            return {
              id: s.id,
              name,
              published: !!s.published,
              updated: s.updated,
              isPrimary: false,
              publicName: await currentPublicName(db(), s.id),
            };
          }),
        )),
      ]
    : [];
  return json({
    profile: activeProfile,
    cards,
    cardLimit: p?.card_limit ?? 1,
    cardsCount: cards.length,
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
