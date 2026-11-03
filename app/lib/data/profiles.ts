import { env } from 'cloudflare:workers';
import { clientDesignAllowed, designSettings } from '../card-design';
import { catalogContentIssue, catalogDocuments, catalogRights } from '../catalog-menu';
import { catalogueError, normalizeCatalogue } from '../catalogue';
import { clientEditIssue } from '../client-access';
import { recordedVideoUrl } from '../content-media';
import { adoptLegacy, cleanupMedia, saveProfileWithMedia, validateMedia } from '../media-storage';
import { capabilities } from '../offers';
import { normalizeAppearance } from '../personalization';
import { replaceProfileLinks } from '../profile-links';
import { normalizePromotions } from '../promotions';
import { normalizeSchedule } from '../schedule';
import { active, db, json } from '../server';
import { trialExpiry } from '../subscription';
import type { Action, DataUser } from './types';

export async function saveProfile(b: Action<'save'>, user: DataUser, admin: boolean) {
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
  const isSecondary = b.id && p && b.id !== p.id;
  let targetProfile = p;
  if (isSecondary) {
    let sec: any = null;
    try {
      sec = await db()
        .prepare('SELECT * FROM secondary_cards WHERE id=? AND owner=?')
        .bind(b.id, user.userId)
        .first();
    } catch {
      sec = null;
    }
    if (!sec)
      return json(
        {
          error: 'Carte introuvable ou accès non autorisé.',
          errorAr: 'ما لقيناش الكارط ولا ما عندكش الحق تعدّلها.',
        },
        404,
      );
    targetProfile = {
      ...p,
      ...sec,
      id: sec.id,
      data: sec.data,
      updated: sec.updated,
      published: sec.published,
    };
  } else if (b.id && !p) {
    // First card creation
  } else if (b.id && p && b.id === p.id) {
    targetProfile = p;
  }
  if (b.revision !== (targetProfile?.updated || null))
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
  const rights = catalogRights(p || { plan: 'Identite' });
  const limit = Math.max(
    rights.maxProducts,
    normalizeCatalogue(p ? JSON.parse(p.data).services : []).length,
  );
  const old = p ? JSON.parse(p.data) : {};
  if (!clientDesignAllowed(b.data, p ? old : null))
    return json(
      {
        error: 'Les sections et la personnalisation avancée sont gérées par l’équipe SoraLink.',
        errorAr: 'الأقسام والتخصيص المفصّل كيتكلف بهم فريق SoraLink.',
      },
      403,
    );
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
  if (clientEditIssue(p || { plan: 'Identite' }, b.data, old, !!b.published))
    return json(
      {
        error: 'Une rubrique modifiée est désactivée par SoraLink. Rechargez votre espace.',
        errorAr: 'شي قسم تبدّل وهو موقوف من طرف SoraLink. عاود حمّل الحساب.',
      },
      403,
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
  let d = { ...b.data, ...designSettings({ ...old, ...b.data }) };
  if (Array.isArray(d.profileLinks)) d = replaceProfileLinks(d, d.profileLinks);
  d = normalizeAppearance(normalizeSchedule(d));
  d.recordedVideo = recordedVideoUrl(d.recordedVideo);
  d.promotions = normalizePromotions(d.promotions);
  d.pro = capabilities(p).appointments;
  d.activity = capabilities(p).activity;
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
          !['image/jpeg', 'image/png', 'image/webp'].includes(meta.httpMetadata?.contentType || ''),
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
  if (isSecondary) {
    const res = await db()
      .prepare(
        'UPDATE secondary_cards SET data=?, published=?, updated=? WHERE id=? AND owner=? AND updated=?',
      )
      .bind(JSON.stringify(d), b.published ? 1 : 0, stamp, b.id, user.userId, targetProfile.updated)
      .run();
    if (!res.meta.changes)
      return json({ error: 'Votre carte a changé. Actualisez avant d’enregistrer.' }, 409);
    return json({ ok: true, id: b.id, revision: stamp, cleanupPending: false });
  }
  if (!(await saveProfileWithMedia(user.userId, p, id, d, !!b.published, user.email, stamp)))
    return json({ error: 'Votre carte a changé. Actualisez avant d’enregistrer.' }, 409);
  const cleaned = await cleanupMedia(user.userId);
  return json({ ok: true, id, revision: stamp, cleanupPending: !cleaned });
}

export async function createCard(b: Action<'createCard'>, user: DataUser) {
  const p: any = await db()
    .prepare('SELECT * FROM profiles WHERE owner=?')
    .bind(user.userId)
    .first();
  if (!p) {
    return json(
      {
        error: 'Créez d’abord votre première carte.',
        errorAr: 'سجّل الكارط الأولى ديالك الأول.',
      },
      400,
    );
  }
  const limit = p.card_limit ?? 1;
  let currentCount = 1;
  try {
    const countRow: any = await db()
      .prepare('SELECT COUNT(*) AS count FROM secondary_cards WHERE owner=?')
      .bind(user.userId)
      .first();
    currentCount = 1 + (Number(countRow?.count) || 0);
  } catch {
    currentCount = 1;
  }
  if (currentCount >= limit) {
    return json(
      {
        error: 'Limite de cartes atteinte pour votre forfait.',
        errorAr: 'وصلتي للحد الأقصى ديال الكارطات المسموحة فهاد الباقة.',
      },
      403,
    );
  }
  const newId = crypto.randomUUID();
  const stamp = new Date().toISOString();
  const initialData = {
    name: b.name?.trim() || '',
    business: '',
    job: '',
    bio: '',
    color: '#00b5ad',
    cardTheme: 'dark',
    cardFont: 'modern',
    buttonShape: 'pill',
    avatarShape: 'circle',
    defaultLanguage: 'fr',
    links: [],
    actions: [],
    services: [],
    promotions: [],
    catalogDocuments: [],
    pdf: '',
    catalogCategories: [],
    catalogSettings: { enabled: true, pdf: true, products: true, whatsapp: true },
  };
  await db()
    .prepare(
      'INSERT INTO secondary_cards (id, owner, data, published, updated, created) VALUES (?, ?, ?, 0, ?, ?)',
    )
    .bind(newId, user.userId, JSON.stringify(initialData), stamp, stamp)
    .run();
  return json({
    ok: true,
    id: newId,
    cardsCount: currentCount + 1,
    cardLimit: limit,
  });
}
