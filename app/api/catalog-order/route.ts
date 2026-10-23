import { env } from 'cloudflare:workers';
import { capabilities } from '../../lib/offers';
import { db, json, active } from '../../lib/server';
import { catalogRights, catalogEnabled } from '../../lib/catalog-menu';
import { catalogOrderSchema, catalogOrderMessage } from '../../lib/catalog-order';
import { publicCardData } from '../../lib/public-card';
import { whatsappNumber } from '../../lib/whatsapp-notification';
import { readValidatedJSON, inputErrorResponse } from '../../lib/api-validation';
import { mailStatement } from '../../lib/notifications';
import { digest, sameOrigin } from '../../lib/commerce';
import { clientSectionAllowed } from '../../lib/client-access';
export async function POST(req: Request) {
  try {
    if (!sameOrigin(req)) return json({ error: 'Accès refusé', errorAr: 'الولوج مرفوض' }, 403);
    const body = await readValidatedJSON(req, catalogOrderSchema, 16000);
    const profile: any = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(body.profile)
      .first();
    if (!profile || !active(profile))
      return json({ error: 'Page indisponible', errorAr: 'الصفحة غير متوفرة' }, 404);
    const rights = catalogRights(profile),
      features = capabilities(profile),
      saved = JSON.parse(profile.data);
    if (!catalogEnabled(saved, rights, 'products') || !catalogEnabled(saved, rights, 'whatsapp'))
      return json(
        { error: 'Les commandes WhatsApp sont désactivées.', errorAr: 'طلبات واتساب غير مفعلة.' },
        403,
      );
    const data = publicCardData(saved, !!profile.pro_enabled, rights, features),
      phone = whatsappNumber(data.whatsapp);
    if (!phone) return json({ error: 'WhatsApp indisponible', errorAr: 'واتساب غير متوفر' }, 403);
    let message: string;
    try {
      message = catalogOrderMessage(data, body.items, body.language === 'ar', body);
    } catch {
      return json(
        {
          error:
            'Vérifiez les articles, variantes et le mode de retrait. Une adresse est nécessaire pour la livraison.',
          errorAr: 'راجع المنتجات والاختيارات وطريقة التسليم. العنوان ضروري للتوصيل.',
        },
        409,
      );
    }
    // Persist an intent, never claim that a WhatsApp message was actually sent.
    const intent = body.intentId || crypto.randomUUID(),
      hash = await digest(JSON.stringify([profile.id, body.language, message]));
    await db()
      .prepare(
        'DELETE FROM catalog_order_intents WHERE id IN (SELECT id FROM catalog_order_intents WHERE created<? LIMIT 100)',
      )
      .bind(new Date(Date.now() - 30 * 86400000).toISOString())
      .run();
    const prior: any = await db()
      .prepare('SELECT profile,payload_hash FROM catalog_order_intents WHERE id=?')
      .bind(intent)
      .first();
    if (prior && (prior.profile !== profile.id || prior.payload_hash !== hash))
      return json({ error: 'Actualisez votre sélection.', errorAr: 'حدّث الاختيار ديالك.' }, 409);
    if (!prior) {
      const now = new Date().toISOString(),
        cutoff = new Date(Date.now() - 15 * 60000).toISOString();
      const visitor = await digest(
        profile.id +
          '|' +
          now.slice(0, 10) +
          '|' +
          (req.headers.get('cf-connecting-ip') || 'unknown'),
      );
      const requestId = crypto.randomUUID();
      const statements = [
        db()
          .prepare(
            'INSERT OR IGNORE INTO catalog_order_intents(id,profile,request_id,payload_hash,visitor_hash,created) SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM catalog_order_intents WHERE visitor_hash=? AND created>?)<10 AND (SELECT COUNT(*) FROM catalog_order_intents WHERE profile=? AND created>?)<30',
          )
          .bind(
            intent,
            profile.id,
            requestId,
            hash,
            visitor,
            now,
            visitor,
            cutoff,
            profile.id,
            cutoff,
          ),
      ];
      const record = features.activity && clientSectionAllowed(profile, 'requests');
      if (record) {
        const ar = body.language === 'ar';
        const service = ar
          ? 'اختيار واتساب — الإرسال باقي للتأكيد'
          : 'Sélection WhatsApp — envoi à confirmer';
        statements.push(
          db()
            .prepare(
              "INSERT INTO requests(id,profile,kind,language,name,phone,message,email,service,status,created) SELECT ?,?,'commande',?,?,?,?,?,?,'new',? WHERE EXISTS(SELECT 1 FROM catalog_order_intents WHERE id=? AND request_id=?)",
            )
            .bind(
              requestId,
              profile.id,
              body.language,
              body.name || (ar ? 'زائر واتساب' : 'Visiteur WhatsApp'),
              body.phone,
              message,
              '',
              service,
              now,
              intent,
              requestId,
            ),
        );
        statements.push(
          ...mailStatement(
            { ...env, DB: db() },
            profile,
            {
              id: requestId,
              kind: 'commande',
              language: body.language,
              name: body.name || (ar ? 'زائر واتساب' : 'Visiteur WhatsApp'),
              phone: body.phone,
              service:
                saved.defaultLanguage === 'ar' || saved.lang === 'ar'
                  ? 'اختيار واتساب — الإرسال باقي للتأكيد'
                  : 'Sélection WhatsApp — envoi à confirmer',
              message: catalogOrderMessage(
                data,
                body.items,
                saved.defaultLanguage === 'ar' || saved.lang === 'ar',
                body,
              ),
              whatsappPrepared: true,
            },
            'new',
            0,
            true,
          ),
        );
      }
      await db().batch(statements);
      const accepted: any = await db()
        .prepare('SELECT profile,payload_hash FROM catalog_order_intents WHERE id=?')
        .bind(intent)
        .first();
      if (!accepted)
        return json(
          {
            error: 'Trop de demandes. Réessayez dans quelques minutes.',
            errorAr: 'طلبات كثيرة. عاود جرّب من بعد شوية.',
          },
          429,
        );
      if (accepted.profile !== profile.id || accepted.payload_hash !== hash)
        return json({ error: 'Actualisez votre sélection.', errorAr: 'حدّث الاختيار ديالك.' }, 409);
    }
    return json({
      url: 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message),
      intentId: intent,
    });
  } catch (error) {
    return (
      inputErrorResponse(error) ||
      json({ error: 'Envoi impossible. Réessayez.', errorAr: 'تعذر الإرسال. عاود جرّب.' }, 503)
    );
  }
}
