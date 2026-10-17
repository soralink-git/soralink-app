import { replaceProfileLinks } from '../../lib/profile-links';
import {
  catalogRights,
  catalogDocuments,
  catalogContentIssue,
  visibleProducts,
  catalogText,
  catalogCategories,
} from '../../lib/catalog-menu';
import { currentPublicName } from '../../lib/address-storage';
import { readHistory, requestNotifications } from '../../lib/history';
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
  catalogueError,
  catalogueLimit,
  catalogueSelection,
  catalogueRequestMessage,
} from '../../lib/catalogue';
import { env } from 'cloudflare:workers';
import { mailStatement, mailEnabled } from '../../lib/notifications';
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
      const d = publicCardData(JSON.parse(p.data), !!p.pro_enabled, catalogRights(p));
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
      d.pro = !!p.pro_enabled;
      p.data = JSON.stringify(d);
    }
    const histories = ['requests', 'contacts', 'orders'] as const;
    const pages = await Promise.all(
      histories.map((kind) => readHistory(db(), user.userId, p?.id, kind)),
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
        if (!['commande', 'devis'].includes(b.kind))
          return json({ error: 'Type de demande invalide' }, 400);
        const catalogueData = JSON.parse(p.data);
        const publishedCatalog = publicCardData(catalogueData, !!p.pro_enabled, catalogRights(p));
        const item = catalogueSelection(publishedCatalog.services, b.catalogueId);
        if (!item || normalizeAppearance(catalogueData).hiddenSections.includes('services'))
          return json({ error: 'Cet article n’est plus disponible. Actualisez la carte.' }, 409);
        service = item.name;
        const category = catalogCategories(publishedCatalog).find((c) => c.id === item.categoryId);
        const arabic = b.language === 'ar';
        const localized = {
          ...item,
          name: catalogText(item.nameFr, item.nameAr, arabic),
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
      if (b.expectedOwner && b.expectedOwner !== user.userId)
        return json(
          {
            error: 'Le compte connecté a changé. Rechargez votre carte avant d’enregistrer.',
            errorAr: 'الحساب المتصل تبدّل. عاود حمّل الكارط قبل التسجيل.',
          },
          409,
        );
      const p: any = await db()
        .prepare('SELECT * FROM profiles WHERE owner=?')
        .bind(user.userId)
        .first();
      if (b.revision !== (p?.updated || null))
        return json(
          {
            error: 'Votre carte a changé. Rechargez-la avant d’enregistrer.',
            errorAr: 'الكارط تبدلات. عاود حمّلها قبل ما تسجّل.',
          },
          409,
        );
      if (b.published && p && !active(p))
        return json(
          {
            error: 'Renouvelez votre abonnement avant de publier.',
            errorAr: 'جدّد الاشتراك قبل ما تنشر الكارط.',
          },
          403,
        );
      const rights = catalogRights(p);
      const limit = Math.max(
        rights.maxProducts,
        normalizeCatalogue(p ? JSON.parse(p.data).services : []).length,
      );
      const old = p ? JSON.parse(p.data) : {};
      const moduleIssue = catalogContentIssue(b.data, old, rights);
      if (moduleIssue)
        return json(
          {
            error: moduleIssue,
            errorAr: 'هاد العملية ما مسموحاش حسب إعدادات الاشتراك. راجع المعلومات.',
          },
          (b.data.services?.length || 0) > rights.maxProducts ||
            catalogDocuments(b.data).length > rights.maxDocuments
            ? 400
            : 403,
        );
      const catalogueIssue = catalogueError(b.data.services, limit);
      if (catalogueIssue)
        return json(
          {
            error: catalogueIssue,
            errorAr: `الكاتالوگ يقدر يكون فيه حتى ${limit} منتجات ولا خدمات.`,
          },
          400,
        );
      const stamp = new Date(Math.max(Date.now(), (Date.parse(p?.updated) || 0) + 1)).toISOString();
      const id = p?.id || crypto.randomUUID();
      let d = b.data;
      if (Array.isArray(d.profileLinks)) d = replaceProfileLinks(d, d.profileLinks);
      d = normalizeAppearance(normalizeSchedule(d));
      d.recordedVideo = recordedVideoUrl(d.recordedVideo);
      d.promotions = normalizePromotions(d.promotions);
      d.pro = !!p?.pro_enabled;
      d.services = normalizeCatalogue(d.services);
      d.catalogDocuments = catalogDocuments(d);
      d.pdf = '';
      d.photos = Array.isArray(d.photos) ? d.photos.slice(0, 10) : [];
      await adoptLegacy(user.userId, p);
      for (const doc of d.catalogDocuments) {
        if (!doc.src)
          return json(
            { error: 'Importez un PDF pour chaque document.', errorAr: 'زيد ملف لكل وثيقة.' },
            400,
          );
        const key = doc.src.split('key=')[1];
        const object = await env.BUCKET?.head(key);
        if (
          !object ||
          object.httpMetadata?.contentType !== 'application/pdf' ||
          object.size > rights.pdfMB * 1024 * 1024
        )
          return json(
            {
              error: 'Ce PDF est invalide ou dépasse les limites de votre offre.',
              errorAr: 'هاد الملف ما صالحش ولا فايت الحد المسموح.',
            },
            400,
          );
        const pages = Number(object.customMetadata?.pages);
        // Previously stored PDFs are validated once on first attachment to the new module.
        if (!Number.isInteger(pages) || pages < 1) {
          const { PDFDocument } = await import('pdf-lib');
          try {
            const file = await env.BUCKET!.get(key);
            const parsed = await PDFDocument.load(await file!.arrayBuffer());
            if (parsed.getPageCount() < 1 || parsed.getPageCount() > rights.pdfPages) throw Error();
          } catch {
            return json(
              {
                error: 'PDF illisible ou trop de pages.',
                errorAr: 'الملف ما كيتقراش ولا فيه صفحات بزاف.',
              },
              400,
            );
          }
        } else if (pages > rights.pdfPages)
          return json(
            {
              error: 'Ce PDF dépasse le nombre de pages autorisé.',
              errorAr: 'عدد صفحات الملف فايت الحد المسموح.',
            },
            400,
          );
      }
      if (!(await validateMedia(user.userId, d, p ? JSON.parse(p.data) : {})))
        return json(
          {
            error:
              'Un média n’est plus disponible ou n’appartient pas à votre compte. Actualisez la page.',
          },
          409,
        );
      const images = [
        ...new Set(
          [
            ...d.services.flatMap((v: any) => [v.image, v.thumbnail, ...v.images]),
            ...d.catalogDocuments.map((v: any) => v.cover),
          ].filter(Boolean),
        ),
      ] as string[];
      for (let start = 0; start < images.length; start += 8) {
        const metas = await Promise.all(
          images.slice(start, start + 8).map((src) => env.BUCKET?.head(src.split('key=')[1])),
        );
        if (
          metas.some(
            (meta) =>
              !meta ||
              !['image/jpeg', 'image/png', 'image/webp'].includes(
                meta.httpMetadata?.contentType || '',
              ),
          )
        )
          return json(
            {
              error: 'Une image du catalogue est invalide.',
              errorAr: 'كاينة صورة ما صالحةش فالكاتالوگ.',
            },
            400,
          );
      }
      if (!(await saveProfileWithMedia(user.userId, p, id, d, !!b.published, user.email, stamp)))
        return json({ error: 'Votre carte a changé. Actualisez avant d’enregistrer.' }, 409);
      const cleaned = await cleanupMedia(user.userId);
      return json({ ok: true, id, revision: stamp, cleanupPending: !cleaned });
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
              'INSERT INTO requests(id,profile,kind,name,phone,message,slot,email,service,duration,status,created,language) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
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
              d.defaultLanguage === 'ar' ? 'ar' : 'fr',
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
              language: d.defaultLanguage === 'ar' ? 'ar' : 'fr',
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
