import { env } from 'cloudflare:workers';
import { db, identity, json } from '../../lib/server';
import { digest, sameOrigin } from '../../lib/commerce';
import { checkFileContent } from '../../lib/upload-content';
import { inputErrorResponse } from '../../lib/api-validation';
const orderId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 128;
export async function GET(req: Request) {
  try {
    const { user, admin } = await identity();
    if (!user) return json({ error: 'Connexion requise', errorAr: 'خاصك تدخل للحساب.' }, 401);
    const order = new URL(req.url).searchParams.get('order');
    if (!orderId(order)) return json({ error: 'Commande invalide', errorAr: 'طلب غير صالح.' }, 400);
    const own = await db()
      .prepare('SELECT id FROM orders WHERE id=? AND (owner=? OR ?=1)')
      .bind(order, user.userId, admin ? 1 : 0)
      .first();
    if (!own) return json({ error: 'Commande introuvable', errorAr: 'ما لقيناش الطلب.' }, 404);
    const result = await db()
      .prepare(
        'SELECT id,mime,bytes,created FROM payment_receipts WHERE order_id=? ORDER BY created DESC LIMIT 3',
      )
      .bind(order)
      .all();
    return json({ receipts: result.results });
  } catch {
    return json({ error: 'Chargement impossible', errorAr: 'تعذر التحميل.' }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: 'Accès refusé', errorAr: 'الولوج مرفوض.' }, 403);
    const { user } = await identity();
    if (!user) return json({ error: 'Connexion requise', errorAr: 'خاصك تدخل للحساب.' }, 401);
    if (Number(req.headers.get('content-length')) > 5 * 1024 * 1024 + 65536)
      return json({ error: 'Fichier de 5 Mo maximum.', errorAr: 'الملف ما يفوتش 5 ميغا.' }, 413);
    const form = await req.formData(),
      order = form.get('order'),
      file = form.get('file');
    if (
      !orderId(order) ||
      !file ||
      typeof file === 'string' ||
      !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) ||
      file.size < 1 ||
      file.size > 5 * 1024 * 1024
    )
      return json(
        {
          error: 'Choisissez un JPEG, PNG ou PDF de 5 Mo maximum.',
          errorAr: 'اختار JPEG ولا PNG ولا PDF ما يفوتش 5 ميغا.',
        },
        400,
      );
    // Renewal proofs remain available when a subscription has expired.
    const own = await db()
      .prepare(
        "SELECT id FROM orders WHERE id=? AND owner=? AND status='pending' AND applied IS NULL",
      )
      .bind(order, user.userId)
      .first();
    if (!own)
      return json(
        {
          error: 'Ce paiement ne peut plus recevoir de justificatif.',
          errorAr: 'هاد الأداء ما بقاش كيقبل الوثائق.',
        },
        409,
      );
    await checkFileContent(file, 10);
    const id = crypto.randomUUID(),
      key = 'receipts/' + (await digest(user.userId)) + '/' + id,
      now = new Date().toISOString();
    if (!env.BUCKET) throw Error('Storage unavailable');
    await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    try {
      const result = await db()
        .prepare(
          "INSERT INTO payment_receipts(id,order_id,owner,object_key,mime,bytes,created) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM orders WHERE id=? AND owner=? AND status='pending' AND applied IS NULL) AND (SELECT COUNT(*) FROM payment_receipts WHERE order_id=?)<3 AND (SELECT COUNT(*) FROM payment_receipts WHERE owner=? AND created>?)<20 RETURNING id",
        )
        .bind(
          id,
          order,
          user.userId,
          key,
          file.type,
          file.size,
          now,
          order,
          user.userId,
          order,
          user.userId,
          new Date(Date.now() - 86400000).toISOString(),
        )
        .all();
      if (!result.results.length) {
        await env.BUCKET.delete(key);
        return json(
          {
            error: 'Limite atteinte ou paiement déjà traité (3 documents par commande).',
            errorAr: 'وصلتي للحد ولا الأداء تعالج (3 وثائق لكل طلب).',
          },
          409,
        );
      }
    } catch (error) {
      await env.BUCKET.delete(key);
      throw error;
    }
    return json({ id });
  } catch (error) {
    return (
      inputErrorResponse(error) ||
      json({ error: 'Dépôt impossible. Réessayez.', errorAr: 'تعذر الإرسال. عاود جرّب.' }, 503)
    );
  }
}
