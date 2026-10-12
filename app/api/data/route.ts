import {
  dataActionSchema,
  dataQuerySchema,
  resolvedRequestSchema,
  readValidatedJSON,
  validateInput,
  inputErrorResponse,
} from '../../lib/api-validation';
import {
  adoptLegacy,
  validateMedia,
  saveProfileWithMedia,
  cleanupMedia,
} from '../../lib/media-storage';
import { publicCardData } from '../../lib/public-card';
import { recordedVideoUrl } from '../../lib/content-media';
import { contactCard } from '../../lib/contact-card';
import {
  normalizeCatalogue,
  catalogueSelection,
  catalogueRequestMessage,
} from '../../lib/catalogue';
import { env } from 'cloudflare:workers';
import { mailStatement, mailReady } from '../../lib/notifications';
import { normalizePromotions } from '../../lib/promotions';
import { normalizeAppearance } from '../../lib/personalization';
import { identity, db, json, active } from '../../lib/server';
import { availableSlots, normalizeSchedule, blocks } from '../../lib/schedule';
export async function GET(req: Request) {
  try {
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
      const d = publicCardData(JSON.parse(p.data), !!p.pro_enabled);
      return json({ id: p.id, data: JSON.stringify(d) });
    }
    if (!user) return json({ error: 'Connexion requise' }, 401);
    const p: any = await db()
      .prepare('SELECT * FROM profiles WHERE owner=?')
      .bind(user.userId)
      .first();
    if (p) {
      await db().prepare('UPDATE profiles SET email=? WHERE id=?').bind(user.email, p.id).run();
      const d = JSON.parse(p.data);
      d.pro = !!p.pro_enabled;
      p.data = JSON.stringify(d);
    }
    const inbox = p
      ? await db()
          .prepare(
            "SELECT * FROM requests WHERE profile=? AND kind!='contact' ORDER BY created DESC LIMIT 500",
          )
          .bind(p.id)
          .all()
      : { results: [] };
    const contacts = p
      ? await db()
          .prepare(
            "SELECT id,name,phone,email,message,created,service AS sourceCardId FROM requests WHERE profile=? AND kind='contact' ORDER BY created DESC LIMIT 500",
          )
          .bind(p.id)
          .all()
      : { results: [] };
    const orders = await db()
      .prepare('SELECT * FROM orders WHERE owner=? ORDER BY created DESC LIMIT 100')
      .bind(user.userId)
      .all();
    const notifications = p
      ? await db()
          .prepare(
            'SELECT id,request_id,state,error,created FROM notifications WHERE profile=? ORDER BY created DESC LIMIT 100',
          )
          .bind(p.id)
          .all()
      : { results: [] };
    return json({
      profile: p,
      requests: inbox.results,
      contacts: contacts.results,
      notifications: notifications.results,
      mailConfigured: mailReady(env as any),
      orders: orders.results,
      user: user.displayName,
      email: user.email,
      admin,
      source,
    });
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Service temporairement indisponible' }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (req.headers.get('origin') !== new URL(req.url).origin)
      return json({ error: 'Accès refusé' }, 403);
    const b = await readValidatedJSON(req, dataActionSchema);
    const { user, admin } = await identity();
    if (b.action === 'request') {
      const p: any = await db()
        .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
        .bind(b.profile)
        .first();
      if (!p || !active(p)) return json({ error: 'Page indisponible' }, 404);
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
        if (b.kind !== 'commande') return json({ error: 'Type de demande invalide' }, 400);
        const catalogueData = JSON.parse(p.data);
        const item = catalogueSelection(catalogueData.services, b.catalogueId);
        if (!item || normalizeAppearance(catalogueData).hiddenSections.includes('services'))
          return json({ error: 'Cet article n’est plus disponible. Actualisez la carte.' }, 409);
        service = item.name;
        message = catalogueRequestMessage(item, message);
        if (message.length > 2000)
          return json({ error: 'Votre message est trop long pour cette demande.' }, 400);
      }
      if (b.kind === 'rdv') {
        if (normalizeAppearance(JSON.parse(p.data)).hiddenSections.includes('appointments'))
          return json({ error: 'Rendez-vous indisponibles' }, 403);
        if (!p.pro_enabled) return json({ error: 'Option Pro non active' }, 403);
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
      if (count.n >= 2)
        return json({ error: 'Veuillez patienter avant une nouvelle demande' }, 429);
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
        name: b.name.slice(0, 120),
        phone: b.phone.slice(0, 40),
        slot: b.kind === 'rdv' ? b.slot : null,
        email,
        service,
      };
      await db().batch([
        db()
          .prepare(
            'INSERT INTO requests(id,profile,kind,name,phone,message,slot,email,service,duration,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
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
          ),
        ...(b.kind === 'contact' ? [] : mailStatement(env as any, p, request, 'new')),
      ]);
      return json({ ok: true });
    }
    if (!user) return json({ error: 'Connexion requise' }, 401);
    if (b.action === 'deleteContact') {
      const result = await db()
        .prepare(
          "DELETE FROM requests WHERE id=? AND kind='contact' AND profile IN (SELECT id FROM profiles WHERE owner=?)",
        )
        .bind(b.id, user.userId)
        .run();
      if (!result.meta.changes) return json({ error: 'Contact introuvable' }, 404);
      return json({ ok: true });
    }
    if (b.action === 'save') {
      const p: any = await db()
        .prepare('SELECT * FROM profiles WHERE owner=?')
        .bind(user.userId)
        .first();
      const id = p?.id || crypto.randomUUID();
      let d = b.data;
      d = normalizeAppearance(normalizeSchedule(d));
      d.recordedVideo = recordedVideoUrl(d.recordedVideo);
      d.promotions = normalizePromotions(d.promotions);
      d.pro = !!p?.pro_enabled;
      d.services = normalizeCatalogue(d.services);
      d.photos = Array.isArray(d.photos) ? d.photos.slice(0, 10) : [];
      await adoptLegacy(user.userId, p);
      if (!(await validateMedia(user.userId, d, p ? JSON.parse(p.data) : {})))
        return json(
          {
            error:
              'Un média n’est plus disponible ou n’appartient pas à votre compte. Actualisez la page.',
          },
          409,
        );
      if (!(await saveProfileWithMedia(user.userId, p, id, d, !!b.published, user.email)))
        return json({ error: 'Votre carte a changé. Actualisez avant d’enregistrer.' }, 409);
      const cleaned = await cleanupMedia(user.userId);
      return json({ ok: true, id, cleanupPending: !cleaned });
    }
    if (b.action === 'manual') {
      const p: any = await db()
        .prepare('SELECT * FROM profiles WHERE owner=?')
        .bind(user.userId)
        .first();
      if (!p || !active(p) || !p.pro_enabled) return json({ error: 'Option Pro inactive' }, 403);
      const d = normalizeSchedule(JSON.parse(p.data));
      const service = d.appointmentServices[Number(b.service || 0)];
      if (!service) return json({ error: 'Prestation invalide' }, 400);
      const date = String(b.slot || '').slice(0, 10);
      const busy = await db()
        .prepare('SELECT slot FROM bookings WHERE profile=? AND slot LIKE ?')
        .bind(p.id, date + '%')
        .all();
      if (
        !availableSlots(
          d,
          date,
          service.duration,
          busy.results.map((x: any) => x.slot),
        ).includes(b.slot)
      )
        return json({ error: 'Créneau hors horaires ou déjà occupé' }, 409);
      const id = crypto.randomUUID();
      try {
        await db().batch([
          db()
            .prepare(
              'INSERT INTO requests(id,profile,kind,name,phone,message,slot,email,service,duration,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
            )
            .bind(
              id,
              p.id,
              'rdv',
              b.name.slice(0, 120),
              b.phone.slice(0, 40),
              String(b.message || '').slice(0, 2000),
              b.slot,
              String(b.email || '').slice(0, 254),
              service.name,
              service.duration,
              'confirmed',
              new Date().toISOString(),
            ),
          ...blocks(b.slot, service.duration).map((slot, i) =>
            db()
              .prepare('INSERT INTO bookings(id,profile,slot) VALUES(?,?,?)')
              .bind(id + ':' + i, p.id, slot),
          ),
          ...mailStatement(
            env as any,
            p,
            {
              id,
              name: b.name,
              phone: b.phone,
              email: b.email,
              kind: 'rdv',
              slot: b.slot,
              service: service.name,
            },
            'confirmed',
            0,
          ),
        ]);
      } catch {
        return json({ error: 'Ce créneau est déjà pris' }, 409);
      }
      return json({ ok: true });
    }
    if (b.action === 'order') {
      const existing = await db()
        .prepare("SELECT id FROM orders WHERE owner=? AND plan=? AND status='pending'")
        .bind(user.userId, b.plan)
        .first();
      if (existing) return json({ error: 'Une demande pour cette offre est déjà en attente' }, 409);
      await db()
        .prepare('INSERT INTO orders(id,owner,plan,status,created) VALUES(?,?,?,?,?)')
        .bind(crypto.randomUUID(), user.userId, b.plan, 'pending', new Date().toISOString())
        .run();
      return json({ ok: true });
    }
    if (b.action === 'status') {
      const r: any = await db()
        .prepare(
          'SELECT requests.* FROM requests JOIN profiles ON profiles.id=requests.profile WHERE requests.id=? AND profiles.owner=?',
        )
        .bind(b.id, user.userId)
        .first();
      if (!r || r.kind === 'contact') return json({ error: 'Accès refusé' }, 403);
      if (r.status === b.status) return json({ ok: true });
      const profile: any = await db()
        .prepare('SELECT * FROM profiles WHERE id=?')
        .bind(r.profile)
        .first();
      const revision = (r.notification_revision || 0) + 1;
      const update = db()
        .prepare(
          'UPDATE requests SET status=?,notification_revision=? WHERE id=? AND notification_revision=?',
        )
        .bind(b.status, revision, r.id, r.notification_revision || 0);
      const notice =
        r.kind === 'rdv' && (b.status === 'confirmed' || b.status === 'cancelled')
          ? mailStatement(env as any, profile, r, b.status, revision)
          : [];
      if (b.status === 'confirmed' && r.kind === 'rdv') {
        if (!r.slot) return json({ error: 'Créneau absent' }, 400);
        const p: any = await db()
          .prepare('SELECT * FROM profiles WHERE id=?')
          .bind(r.profile)
          .first();
        if (!active(p) || !p.pro_enabled) return json({ error: 'Option Pro inactive' }, 403);
        if (r.status === 'confirmed') return json({ ok: true });
        const busy = await db()
          .prepare('SELECT slot FROM bookings WHERE profile=? AND slot LIKE ?')
          .bind(p.id, r.slot.slice(0, 10) + '%')
          .all();
        if (
          !availableSlots(
            JSON.parse(p.data),
            r.slot.slice(0, 10),
            r.duration,
            busy.results.map((x: any) => x.slot),
          ).includes(r.slot)
        )
          return json({ error: 'Créneau devenu indisponible' }, 409);
        try {
          await db().batch([
            ...blocks(r.slot, r.duration).map((slot, i) =>
              db()
                .prepare(
                  'INSERT INTO bookings(id,profile,slot) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM requests WHERE id=? AND notification_revision=?)',
                )
                .bind(r.id + ':' + i, r.profile, slot, r.id, r.notification_revision || 0),
            ),
            update,
            ...notice,
          ]);
        } catch {
          return json({ error: 'Ce créneau chevauche un rendez-vous confirmé' }, 409);
        }
      } else {
        await db().batch([
          db()
            .prepare(
              'DELETE FROM bookings WHERE (id=? OR id LIKE ?) AND EXISTS(SELECT 1 FROM requests WHERE id=? AND notification_revision=?)',
            )
            .bind(r.id, r.id + ':%', r.id, r.notification_revision || 0),
          update,
          ...notice,
        ]);
      }
      return json({ ok: true });
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Enregistrement impossible. Réessayez.' }, 503);
  }
}
