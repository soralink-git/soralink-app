import { dataActionSchema, inputErrorResponse, readValidatedJSON } from '../../lib/api-validation';
import { clientSectionAllowed } from '../../lib/client-access';
import { createAppointment, deleteContact, updateRequestStatus } from '../../lib/data/activity';
import { createOrder } from '../../lib/data/orders';
import { saveProfile } from '../../lib/data/profiles';
import { readData } from '../../lib/data/read';
import { submitPublicRequest } from '../../lib/data/requests';
import { capabilities } from '../../lib/offers';
import { active, db, identity, json } from '../../lib/server';
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
    const { user, admin } = await identity();
    if (b.action === 'request') return await submitPublicRequest(b, user);
    if (!user) return json({ error: 'Connexion requise' }, 401);
    if (['manual', 'status', 'deleteContact'].includes(b.action)) {
      const ownerProfile: any = await db()
        .prepare('SELECT * FROM profiles WHERE owner=?')
        .bind(user.userId)
        .first();
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
        return await saveProfile(b, user, admin);
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
