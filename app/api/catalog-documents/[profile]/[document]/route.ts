import { capabilities } from '../../../../lib/offers';
import { db, identity, active, json } from '../../../../lib/server';
import { catalogDocuments, catalogRights } from '../../../../lib/catalog-menu';
import { publicCardData } from '../../../../lib/public-card';
import { GET as readMedia } from '../../../upload/route';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ profile: string; document: string }> },
) {
  try {
    const { profile, document } = await params;
    const p: any = await db().prepare('SELECT * FROM profiles WHERE id=?').bind(profile).first();
    if (!p) return new Response(null, { status: 404 });
    const rights = catalogRights(p);
    let doc =
      p.published && active(p)
        ? catalogDocuments(
            publicCardData(JSON.parse(p.data), !!p.pro_enabled, rights, capabilities(p)),
          ).find((d) => d.id === document)
        : undefined;
    if (!doc) {
      const { user } = await identity();
      if (user?.userId !== p.owner || !rights.enabled || !rights.pdf || !active(p))
        return new Response(null, { status: 404 });
      doc = catalogDocuments(JSON.parse(p.data)).find((d) => d.id === document);
    }
    if (!doc?.src) return new Response(null, { status: 404 });
    const download = new URL(req.url).searchParams.get('download') === '1';
    if (download && (!rights.downloads || !doc.allowDownload))
      return new Response(null, { status: 403 });
    const target = new URL(doc.src, req.url);
    if (download) target.searchParams.set('download', '1');
    return readMedia(new Request(target, { headers: req.headers }));
  } catch {
    return json({ error: 'Document indisponible', errorAr: 'الوثيقة غير متوفرة' }, 503);
  }
}
