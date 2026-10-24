import { env } from 'cloudflare:workers';
import { resolvedRequestSchema, validateInput } from '../api-validation';
import { catalogCategories, catalogRights, catalogText } from '../catalog-menu';
import { selectedProduct } from '../catalog-order';
import { catalogueRequestMessage, catalogueSelection } from '../catalogue';
import { contactCard } from '../contact-card';
import { mailStatement } from '../notifications';
import { capabilities } from '../offers';
import { normalizeAppearance } from '../personalization';
import { publicCardData } from '../public-card';
import { availableSlots, normalizeSchedule } from '../schedule';
import { active, db, json } from '../server';
import type { Action, DataUser } from './types';

export async function submitPublicRequest(b: Action<'request'>, user: DataUser | null) {
  const p: any = await db()
    .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
    .bind(b.profile)
    .first();
  if (!p || !active(p)) return json({ error: 'Page indisponible' }, 404);
  if (!capabilities(p).activity)
    return json(
      {
        error: 'Les demandes nécessitent le pack Suivi de mon activité.',
        errorAr: 'الطلبات خاصها باقة تتبّع النشاط.',
      },
      403,
    );
  let sourceCardId = '';
  if (b.shareCard === true) {
    if (b.kind !== 'contact') return json({ error: 'Type de partage invalide' }, 400);
    if (!user) return json({ error: 'Connectez-vous pour partager votre carte' }, 401);
    const own: any = await db()
      .prepare('SELECT * FROM profiles WHERE owner=?')
      .bind(user.userId)
      .first();
    const ownCard = own && active(own) ? contactCard(own) : null;
    if (!ownCard)
      return json(
        {
          error:
            'Publiez une carte avec un nom et un téléphone visible, ou remplissez le formulaire',
        },
        409,
      );
    if (ownCard.id === p.id)
      return json({ error: 'Vous ne pouvez pas partager votre carte avec vous-même' }, 409);
    sourceCardId = ownCard.id;
    b.name = ownCard.name;
    b.phone = ownCard.phone;
    b.email = ownCard.email;
  }
  Object.assign(b, validateInput(resolvedRequestSchema, b));
  const email = b.email;
  let duration = 30,
    service = sourceCardId,
    message = String(b.message || '');
  if (b.catalogueId !== undefined && b.catalogueId !== null) {
    if (!['commande', 'devis'].includes(b.kind))
      return json({ error: 'Type de demande invalide' }, 400);
    const catalogueData = JSON.parse(p.data);
    const publishedCatalog = publicCardData(
      catalogueData,
      !!capabilities(p).appointments,
      catalogRights(p),
      capabilities(p),
    );
    const baseItem = catalogueSelection(publishedCatalog.services, b.catalogueId);
    if (!baseItem || normalizeAppearance(catalogueData).hiddenSections.includes('services'))
      return json({ error: 'Cet article n’est plus disponible. Actualisez la carte.' }, 409);
    service = baseItem.name;
    let item = baseItem;
    try {
      item = selectedProduct(baseItem, b.variantId || undefined);
    } catch {
      return json({ error: 'Variante indisponible', errorAr: 'هاد الاختيار ما متوفرش.' }, 409);
    }
    const category = catalogCategories(publishedCatalog).find((c) => c.id === item.categoryId);
    const arabic = b.language === 'ar';
    const localized = {
      ...item,
      name:
        catalogText(item.nameFr, item.nameAr, arabic) +
        (b.variantId
          ? ' · ' +
            catalogText(
              item.variants.find((v) => v.id === b.variantId)?.nameFr,
              item.variants.find((v) => v.id === b.variantId)?.nameAr,
              arabic,
            )
          : ''),
      category: category
        ? catalogText(category.nameFr, category.nameAr, arabic)
        : catalogText(item.category, item.categoryAr, arabic, true),
    };
    service = localized.name;
    message = catalogueRequestMessage(localized, message, arabic);
    if (message.length > 2000)
      return json({ error: 'Votre message est trop long pour cette demande.' }, 400);
  }
  if (b.kind === 'rdv') {
    if (normalizeAppearance(JSON.parse(p.data)).hiddenSections.includes('appointments'))
      return json({ error: 'Rendez-vous indisponibles' }, 403);
    if (!capabilities(p).appointments) return json({ error: 'Option Pro non active' }, 403);
    const d = normalizeSchedule(JSON.parse(p.data));
    const s = d.appointmentServices[Number(b.service || 0)];
    if (!s) return json({ error: 'Prestation invalide' }, 400);
    duration = s.duration;
    service = s.name;
    const date = String(b.slot || '').slice(0, 10);
    const busy = await db()
      .prepare('SELECT slot FROM bookings WHERE profile=? AND slot LIKE ?')
      .bind(p.id, date + '%')
      .all();
    if (
      !availableSlots(
        d,
        date,
        duration,
        busy.results.map((x: any) => x.slot),
      ).includes(b.slot)
    )
      return json({ error: 'Créneau indisponible. Choisissez un autre horaire.' }, 409);
  }
  const count: any = await db()
    .prepare('SELECT COUNT(*) as n FROM requests WHERE profile=? AND phone=? AND created>?')
    .bind(p.id, b.phone.slice(0, 40), new Date(Date.now() - 60000).toISOString())
    .first();
  if (count.n >= 2) return json({ error: 'Veuillez patienter avant une nouvelle demande' }, 429);
  const profileCount: any = await db()
    .prepare('SELECT COUNT(*) as n FROM requests WHERE profile=? AND created>?')
    .bind(p.id, new Date(Date.now() - 60000).toISOString())
    .first();
  if (profileCount.n >= 10)
    return json({ error: 'Veuillez patienter avant une nouvelle demande' }, 429);
  const id = crypto.randomUUID();
  const request = {
    id,
    kind: b.kind,
    language: b.language,
    name: b.name.slice(0, 120),
    phone: b.phone.slice(0, 40),
    slot: b.kind === 'rdv' ? b.slot : null,
    email,
    service,
  };
  await db().batch([
    db()
      .prepare(
        'INSERT INTO requests(id,profile,kind,name,phone,message,slot,email,service,duration,status,created,language) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .bind(
        id,
        p.id,
        b.kind,
        request.name,
        request.phone,
        message,
        request.slot,
        email,
        service,
        duration,
        b.kind === 'contact' ? 'shared' : 'new',
        new Date().toISOString(),
        b.language,
      ),
    ...(b.kind === 'contact' ? [] : mailStatement(env as any, p, request, 'new')),
  ]);
  return json({ ok: true });
}
