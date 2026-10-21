import { capabilities } from '../../lib/offers';
import { db, json, active } from '../../lib/server';
import { catalogRights, catalogEnabled } from '../../lib/catalog-menu';
import { catalogOrderSchema, catalogOrderMessage } from '../../lib/catalog-order';
import { publicCardData } from '../../lib/public-card';
import { whatsappNumber } from '../../lib/whatsapp-notification';
import { readValidatedJSON, inputErrorResponse } from '../../lib/api-validation';
export async function POST(req: Request) {
  try {
    if (req.headers.get('origin') !== new URL(req.url).origin)
      return json({ error: 'Accès refusé', errorAr: 'الولوج مرفوض' }, 403);
    const body = await readValidatedJSON(req, catalogOrderSchema, 12000);
    const profile: any = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(body.profile)
      .first();
    if (!profile || !active(profile))
      return json({ error: 'Page indisponible', errorAr: 'الصفحة غير متوفرة' }, 404);
    const rights = catalogRights(profile),
      saved = JSON.parse(profile.data);
    if (!catalogEnabled(saved, rights, 'products') || !catalogEnabled(saved, rights, 'whatsapp'))
      return json(
        { error: 'Les commandes WhatsApp sont désactivées.', errorAr: 'طلبات واتساب غير مفعلة.' },
        403,
      );
    const data = publicCardData(saved, !!profile.pro_enabled, rights, capabilities(profile)),
      phone = whatsappNumber(data.whatsapp);
    if (!phone) return json({ error: 'WhatsApp indisponible', errorAr: 'واتساب غير متوفر' }, 403);
    try {
      const message = catalogOrderMessage(data, body.items, body.language === 'ar');
      return json({ url: 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message) });
    } catch {
      return json(
        {
          error: 'Un article n’est plus disponible. Actualisez votre sélection.',
          errorAr: 'كاين منتج ما بقاش متوفر. حدّث الاختيار ديالك.',
        },
        409,
      );
    }
  } catch (error) {
    return (
      inputErrorResponse(error) ||
      json({ error: 'Envoi impossible. Réessayez.', errorAr: 'تعذر الإرسال. عاود جرّب.' }, 503)
    );
  }
}
