import { capabilities } from '../../lib/offers';
import { catalogRights, catalogDocuments } from '../../lib/catalog-menu';
import { checkFileContent } from '../../lib/upload-content';
import {
  mediaUploadSchema,
  uploadQuerySchema,
  validateInput,
  inputErrorResponse,
  ApiInputError,
} from '../../lib/api-validation';
import { adoptLegacy, storageUsage, reserveMedia, cleanupMedia } from '../../lib/media-storage';
import { env } from 'cloudflare:workers';
import { identity, db, active } from '../../lib/server';
import { publicCardData } from '../../lib/public-card';
import { mediaKeys } from '../../lib/media-storage';
import { byteRange, MAX_VIDEO_BYTES } from '../../lib/content-media';
function bucket() {
  if (!env.BUCKET) throw new Error('Storage unavailable');
  return env.BUCKET;
}
export async function POST(req: Request) {
  try {
    const { user: u, admin } = await identity();
    if (!u) return Response.json({ error: 'Connexion requise' }, { status: 401 });
    if (req.headers.get('origin') !== new URL(req.url).origin)
      return new Response(null, { status: 403 });
    const length = Number(req.headers.get('content-length'));
    if (length > MAX_VIDEO_BYTES + 1024 * 1024)
      return Response.json({ error: 'Fichier trop volumineux' }, { status: 413 });
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiInputError('Choisissez un fichier valide.');
    }
    const entry = form.get('file');
    if (!entry || typeof entry === 'string')
      return Response.json({ error: 'Choisissez un fichier' }, { status: 400 });
    validateInput(mediaUploadSchema, { type: entry.type, size: entry.size });
    const profileId = form.get('profileId');
    if (
      profileId !== null &&
      (!admin || typeof profileId !== 'string' || !profileId.trim() || profileId.length > 128)
    )
      return Response.json(
        { error: 'Accès refusé', errorAr: 'ما عندكش الصلاحية.' },
        { status: 403 },
      );
    if (profileId !== null && !['image/jpeg', 'image/png', 'image/webp'].includes(entry.type))
      return Response.json(
        { error: 'Choisissez une image.', errorAr: 'اختار تصويرة.' },
        { status: 400 },
      );
    const profile = await db()
      .prepare(
        profileId !== null
          ? 'SELECT * FROM profiles WHERE id=?'
          : 'SELECT * FROM profiles WHERE owner=?',
      )
      .bind(profileId ?? u.userId)
      .first();
    if (profileId !== null && !profile)
      return Response.json(
        { error: 'Profil introuvable', errorAr: 'ما لقيناش الكارط.' },
        { status: 404 },
      );
    const owner = profileId !== null ? String(profile!.owner) : u.userId;
    if (profile && !active(profile))
      return Response.json(
        {
          error: 'Renouvelez votre abonnement pour importer des fichiers.',
          errorAr: 'جدّد الاشتراك باش تزيد الملفات.',
        },
        { status: 403 },
      );
    const rights = catalogRights(profile);
    const purpose = form.get('purpose');
    if (
      (purpose === 'catalog-image' && (!rights.enabled || !rights.products)) ||
      (purpose === 'catalog-offer' && !rights.enabled) ||
      (purpose === 'catalog-cover' && (!rights.enabled || !rights.pdf)) ||
      (entry.type === 'application/pdf' && (!rights.enabled || !rights.pdf))
    )
      return Response.json(
        {
          error: 'Cette fonction est désactivée pour votre offre.',
          errorAr: 'هاد الخاصية ما مفعّلاش فالاشتراك ديالك.',
        },
        { status: 403 },
      );
    if (entry.type === 'application/pdf' && entry.size > rights.pdfMB * 1024 * 1024)
      return Response.json(
        { error: 'PDF trop volumineux pour votre offre.', errorAr: 'حجم الملف فايت الحد المسموح.' },
        { status: 413 },
      );
    const metadata = await checkFileContent(entry, rights.pdfPages);
    await adoptLegacy(owner, profile);
    await cleanupMedia(owner);
    const key = crypto.randomUUID();
    if (!(await reserveMedia(owner, key, entry.size, rights)))
      return Response.json(
        {
          error: `Stockage plein : ${rights.storageMB} Mo ou ${rights.maxFiles} fichiers maximum. Retirez des médias puis enregistrez votre carte.`,
        },
        { status: 413 },
      );
    try {
      await bucket().put(key, entry.stream(), {
        httpMetadata: { contentType: entry.type },
        customMetadata: metadata,
      });
      await db()
        .prepare("UPDATE media_assets SET state='ready' WHERE key=? AND state='pending'")
        .bind(key)
        .run();
    } catch {
      await db().prepare("UPDATE media_assets SET state='deleting' WHERE key=?").bind(key).run();
      await cleanupMedia(owner);
      throw new Error('Upload failed');
    }
    return Response.json({
      url: '/api/upload?key=' + key,
      storage: await storageUsage(owner, rights),
    });
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return Response.json({ error: 'Importation impossible. Réessayez.' }, { status: 503 });
  }
}
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = uploadQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return new Response(null, { status: 404 });
    if (parsed.data.stats === '1') {
      const { user } = await identity();
      if (!user) return Response.json({ error: 'Connexion requise' }, { status: 401 });
      const p = await db()
        .prepare('SELECT * FROM profiles WHERE owner=?')
        .bind(user.userId)
        .first();
      await adoptLegacy(user.userId, p);
      await cleanupMedia(user.userId);
      return Response.json(await storageUsage(user.userId, catalogRights(p)), {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    const key = parsed.data.key;
    if (!key) return new Response(null, { status: 404 });
    const asset: any = await db()
      .prepare('SELECT owner,state FROM media_assets WHERE key=?')
      .bind(key)
      .first();
    if (asset && asset.state !== 'ready')
      return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const references = await db()
      .prepare(
        'SELECT p.* FROM profiles p JOIN profile_media m ON m.profile_id=p.id WHERE m.media_key=? AND p.published=1',
      )
      .bind(key)
      .all();
    const visible = references.results.some(
      (p: any) =>
        active(p) &&
        mediaKeys(
          publicCardData(JSON.parse(p.data), !!p.pro_enabled, catalogRights(p), capabilities(p)),
        ).includes(key),
    );
    if (!visible) {
      const { user, admin } = await identity();
      const linked: any = user
        ? await db()
            .prepare(
              'SELECT p.data FROM profiles p JOIN profile_media m ON m.profile_id=p.id WHERE m.media_key=? AND p.owner=?',
            )
            .bind(key, user.userId)
            .first()
        : null;
      const owned =
        user &&
        (asset?.owner === user.userId ||
          (linked && mediaKeys(JSON.parse(linked.data)).includes(key)));
      if (!owned && !admin)
        return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    if (url.searchParams.get('download') === '1') {
      const allowed = references.results.some(
        (p: any) =>
          active(p) &&
          catalogDocuments(
            publicCardData(JSON.parse(p.data), !!p.pro_enabled, catalogRights(p), capabilities(p)),
          ).some((d) => d.src === '/api/upload?key=' + key && d.allowDownload),
      );
      if (!allowed) return new Response(null, { status: 403 });
    }
    const header = req.headers.get('range');
    let range: { offset: number; length: number } | undefined;
    if (header) {
      const meta = await bucket().head(key);
      if (!meta) return new Response(null, { status: 404 });
      const parsed = byteRange(header, meta.size);
      if (!parsed)
        return new Response(null, {
          status: 416,
          headers: { 'Content-Range': 'bytes */' + meta.size },
        });
      range = parsed;
    }
    const f = await bucket().get(key, range ? { range } : undefined);
    if (!f || !('body' in f)) return new Response(null, { status: 404 });
    const headers = new Headers({
      'Content-Type': f.httpMetadata?.contentType || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Content-Length': String(range?.length ?? f.size),
    });
    if (url.searchParams.get('download') === '1')
      headers.set('Content-Disposition', 'attachment; filename="catalogue.pdf"');
    if (range)
      headers.set(
        'Content-Range',
        `bytes ${range.offset}-${range.offset + range.length - 1}/${f.size}`,
      );
    return new Response(f.body, { status: range ? 206 : 200, headers });
  } catch {
    return new Response(null, { status: 503 });
  }
}
