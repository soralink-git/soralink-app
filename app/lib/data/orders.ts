import { isPlatformPlan, offerPrice, RENEWAL_PRICE } from '../offers';
import { db, json } from '../server';
import type { Action, DataUser } from './types';

export async function createOrder(b: Action<'order'>, user: DataUser) {
  const profile: any = await db()
    .prepare('SELECT * FROM profiles WHERE owner=?')
    .bind(user.userId)
    .first();
  if (!profile)
    return json(
      {
        error: 'Enregistrez votre carte avant de demander une offre.',
        errorAr: 'سجّل الكارط قبل طلب العرض.',
      },
      409,
    );
  const renewal = b.kind === 'renewal';
  const plan = renewal ? profile.plan : b.plan;
  if (!renewal && !isPlatformPlan(plan))
    return json(
      { error: 'Choisissez une offre actuelle.', errorAr: 'اختار باقة من العروض الحالية.' },
      400,
    );
  if (
    renewal &&
    ![...['Identite', 'Catalogue', 'Activite', 'Digital', 'Pack', 'Accompagnement']].includes(plan)
  )
    return json(
      {
        error: 'Contactez l’assistance pour ce renouvellement.',
        errorAr: 'تواصل مع المساعدة باش تجدّد.',
      },
      400,
    );
  const kind = renewal ? 'renewal' : 'purchase';
  const existing = await db()
    .prepare("SELECT id FROM orders WHERE owner=? AND plan=? AND kind=? AND status='pending'")
    .bind(user.userId, plan, kind)
    .first();
  if (existing)
    return json(
      {
        error: 'Une demande pour cette offre est déjà en attente',
        errorAr: 'كاين طلب فانتظار التأكيد لهاد الباقة.',
      },
      409,
    );
  const amount = renewal ? RENEWAL_PRICE : offerPrice(plan);
  await db()
    .prepare('INSERT INTO orders(id,owner,plan,status,created,kind,amount) VALUES(?,?,?,?,?,?,?)')
    .bind(crypto.randomUUID(), user.userId, plan, 'pending', new Date().toISOString(), kind, amount)
    .run();
  return json({ ok: true, plan, kind, amount });
}
