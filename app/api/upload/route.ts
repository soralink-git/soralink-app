import { adoptLegacy, storageUsage, reserveMedia, cleanupMedia } from '../../lib/media-storage';
import { env } from 'cloudflare:workers';
import { identity, db } from '../../lib/server';
import { mediaError, byteRange, MAX_VIDEO_BYTES } from '../../lib/content-media';
function bucket() {
  if (!env.BUCKET) throw new Error('Storage unavailable');
  return env.BUCKET;
}
export async function POST(req: Request) {
  try {
    const { user: u } = await identity();
    if (!u) return Response.json({ error: 'Connexion requise' }, { status: 401 });
    if (req.headers.get('origin') !== new URL(req.url).origin)
      return new Response(null, { status: 403 });
    const length = Number(req.headers.get('content-length'));
    if (length > MAX_VIDEO_BYTES + 1024 * 1024)
      return Response.json({ error: 'Fichier trop volumineux' }, { status: 413 });
    const form = await req.formData(),
      entry = form.get('file');
    if (!entry || typeof entry === 'string')
      return Response.json({ error: 'Choisissez un fichier' }, { status: 400 });
    const error = mediaError(entry.type, entry.size);
    if (error) return Response.json({ error }, { status: 400 });
    const profile = await db()
      .prepare('SELECT * FROM profiles WHERE owner=?')
      .bind(u.userId)
      .first();
    await adoptLegacy(u.userId, profile);
    await cleanupMedia(u.userId);
    const key = crypto.randomUUID();
    if (!(await reserveMedia(u.userId, key, entry.size)))
      return Response.json(
        {
          error:
            'Stockage plein : 400 Mo ou 80 fichiers maximum. Retirez des médias puis enregistrez votre carte.',
        },
        { status: 413 },
      );
    try {
      await bucket().put(key, entry.stream(), { httpMetadata: { contentType: entry.type } });
      await db()
        .prepare("UPDATE media_assets SET state='ready' WHERE key=? AND state='pending'")
        .bind(key)
        .run();
    } catch {
      await db().prepare("UPDATE media_assets SET state='deleting' WHERE key=?").bind(key).run();
      await cleanupMedia(u.userId);
      throw new Error('Upload failed');
    }
    return Response.json({ url: '/api/upload?key=' + key, storage: await storageUsage(u.userId) });
  } catch {
    return Response.json({ error: 'Importation impossible. Réessayez.' }, { status: 503 });
  }
}
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get('stats') === '1') {
      const { user } = await identity();
      if (!user) return Response.json({ error: 'Connexion requise' }, { status: 401 });
      const p = await db()
        .prepare('SELECT * FROM profiles WHERE owner=?')
        .bind(user.userId)
        .first();
      await adoptLegacy(user.userId, p);
      await cleanupMedia(user.userId);
      return Response.json(await storageUsage(user.userId), {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    const key = url.searchParams.get('key');
    if (!key || !/^[a-f0-9-]{36}$/.test(key)) return new Response(null, { status: 404 });
    const asset: any = await db()
      .prepare('SELECT state FROM media_assets WHERE key=?')
      .bind(key)
      .first();
    if (asset && asset.state !== 'ready')
      return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
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
