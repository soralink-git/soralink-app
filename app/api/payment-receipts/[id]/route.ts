import { env } from 'cloudflare:workers';
import { db, identity, json } from '../../../lib/server';
import { privateFileHeaders } from '../../../lib/commerce';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, admin } = await identity();
    if (!user) return json({ error: 'Connexion requise' }, 401);
    const { id } = await params;
    if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
    const receipt: any = await db()
      .prepare(
        'SELECT r.* FROM payment_receipts r JOIN orders o ON o.id=r.order_id WHERE r.id=? AND (o.owner=? OR ?=1)',
      )
      .bind(id, user.userId, admin ? 1 : 0)
      .first();
    if (!receipt)
      return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const object = await env.BUCKET?.get(receipt.object_key);
    if (!object) return new Response(null, { status: 404 });
    const extension =
      receipt.mime === 'application/pdf' ? 'pdf' : receipt.mime === 'image/png' ? 'png' : 'jpg';
    return new Response(object.body, {
      headers: privateFileHeaders(receipt.mime, 'justificatif-' + id.slice(0, 8) + '.' + extension),
    });
  } catch {
    return json({ error: 'Document indisponible' }, 503);
  }
}
