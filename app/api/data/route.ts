import { dataActionSchema, inputErrorResponse, readValidatedJSON } from '../../lib/api-validation';
import { clientSectionAllowed } from '../../lib/client-access';
import { createAppointment, deleteContact, updateRequestStatus } from '../../lib/data/activity';
import { createOrder } from '../../lib/data/orders';
import { createCard, saveProfile } from '../../lib/data/profiles';
import { readData } from '../../lib/data/read';
import { submitPublicRequest } from '../../lib/data/requests';
import { capabilities } from '../../lib/offers';
import { active, db, identity, json } from '../../lib/server';
import { allowRequest, verifyTurnstile } from '../../lib/rate-limit';
import { env } from 'cloudflare:workers';
import { readAccountCard, readCard } from '../../lib/card-storage';
export async function GET(req: Request) {
  try {
    return await readData(req);
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
    const { user } = await identity();
    if (b.action === 'request') {
      const ip = req.headers.get('cf-connecting-ip') || '';
      if (ip && !(await allowRequest(db(), 'request:' + ip, 10, 3600000)))
        return json(
          {
            error: 'Trop de demandes envoyées. Réessayez dans une heure.',
            errorAr: 'سيفطتي بزاف من الطلبات. عاود جرّب من بعد ساعة.',
          },
          429,
        );
      if (!(await verifyTurnstile(env.TURNSTILE_SECRET_KEY, b.turnstileToken, ip || undefined)))
        return json(
          {
            error: 'Vérification anti-robot échouée. Rechargez la page et réessayez.',
            errorAr: 'التحقق من أنك ماشي روبوت ما نجحش. عاود حمّل الصفحة.',
          },
          400,
        );
      return await submitPublicRequest(b, user);
    }
    if (!user) return json({ error: 'Connexion requise' }, 401);
    if (b.action === 'manual' || b.action === 'status' || b.action === 'deleteContact') {
      // For record mutations authorize the record's actual card, never a client-supplied owner.
      const record: any =
        b.action === 'manual'
          ? null
          : await db().prepare('SELECT profile FROM requests WHERE id=?').bind(b.id).first();
      const ownerProfile =
        b.action === 'manual'
          ? await readAccountCard(db(), user.userId, b.cardId)
          : record && (!b.cardId || b.cardId === record.profile)
            ? await readCard(db(), record.profile, { owner: user.userId })
            : null;
      if (
        !ownerProfile ||
        !active(ownerProfile) ||
        !capabilities(ownerProfile).activity ||
        !clientSectionAllowed(ownerProfile, b.action === 'deleteContact' ? 'contacts' : 'requests')
      )
        return json(
          {
            error: 'Le suivi nécessite le pack Suivi de mon activité.',
            errorAr: 'التتبّع خاصو باقة تتبّع النشاط.',
          },
          403,
        );
    }
    switch (b.action) {
      case 'save':
        return await saveProfile(b, user);
      case 'createCard':
        return await createCard(b, user);
      case 'manual':
        return await createAppointment(b, user);
      case 'status':
        return await updateRequestStatus(b, user);
      case 'deleteContact':
        return await deleteContact(b, user);
      case 'order':
        return await createOrder(b, user);
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Enregistrement impossible. Réessayez.' }, 503);
  }
}
