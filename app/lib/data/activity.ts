import { env } from 'cloudflare:workers';
import { mailStatement } from '../notifications';
import { capabilities } from '../offers';
import { availableSlots, blocks, normalizeSchedule } from '../schedule';
import { active, db, json } from '../server';
import type { Action, DataUser } from './types';

export async function createAppointment(b: Action<'manual'>, user: DataUser) {
  const p: any = await db()
    .prepare('SELECT * FROM profiles WHERE owner=?')
    .bind(user.userId)
    .first();
  if (!p || !active(p) || !capabilities(p).appointments)
    return json({ error: 'Option Pro inactive' }, 403);
  const d = normalizeSchedule(JSON.parse(p.data));
  const service = d.appointmentServices[Number(b.service || 0)];
  if (!service) return json({ error: 'Prestation invalide' }, 400);
  const date = String(b.slot || '').slice(0, 10);
  const busy = await db()
    .prepare('SELECT slot FROM bookings WHERE profile=? AND slot LIKE ?')
    .bind(p.id, date + '%')
    .all();
  if (
    !availableSlots(
      d,
      date,
      service.duration,
      busy.results.map((x: any) => x.slot),
    ).includes(b.slot)
  )
    return json({ error: 'Créneau hors horaires ou déjà occupé' }, 409);
  const id = crypto.randomUUID();
  try {
    await db().batch([
      db()
        .prepare(
          'INSERT INTO requests(id,profile,kind,name,phone,message,slot,email,service,duration,status,created,language) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
        )
        .bind(
          id,
          p.id,
          'rdv',
          b.name.slice(0, 120),
          b.phone.slice(0, 40),
          String(b.message || '').slice(0, 2000),
          b.slot,
          String(b.email || '').slice(0, 254),
          service.name,
          service.duration,
          'confirmed',
          new Date().toISOString(),
          d.defaultLanguage === 'ar' ? 'ar' : 'fr',
        ),
      ...blocks(b.slot, service.duration).map((slot, i) =>
        db()
          .prepare('INSERT INTO bookings(id,profile,slot) VALUES(?,?,?)')
          .bind(id + ':' + i, p.id, slot),
      ),
      ...mailStatement(
        env as any,
        p,
        {
          id,
          name: b.name,
          phone: b.phone,
          email: b.email,
          kind: 'rdv',
          language: d.defaultLanguage === 'ar' ? 'ar' : 'fr',
          slot: b.slot,
          service: service.name,
        },
        'confirmed',
        0,
      ),
    ]);
  } catch {
    return json({ error: 'Ce créneau est déjà pris' }, 409);
  }
  return json({ ok: true });
}

export async function updateRequestStatus(b: Action<'status'>, user: DataUser) {
  const r: any = await db()
    .prepare(
      'SELECT requests.* FROM requests JOIN profiles ON profiles.id=requests.profile WHERE requests.id=? AND profiles.owner=?',
    )
    .bind(b.id, user.userId)
    .first();
  if (!r || r.kind === 'contact') return json({ error: 'Accès refusé' }, 403);
  if (r.status === b.status) return json({ ok: true });
  const profile: any = await db()
    .prepare('SELECT * FROM profiles WHERE id=?')
    .bind(r.profile)
    .first();
  const revision = (r.notification_revision || 0) + 1;
  const update = db()
    .prepare(
      'UPDATE requests SET status=?,notification_revision=? WHERE id=? AND notification_revision=?',
    )
    .bind(b.status, revision, r.id, r.notification_revision || 0);
  const notice =
    r.kind === 'rdv' && (b.status === 'confirmed' || b.status === 'cancelled')
      ? mailStatement(env as any, profile, r, b.status, revision)
      : [];
  if (b.status === 'confirmed' && r.kind === 'rdv') {
    if (!r.slot) return json({ error: 'Créneau absent' }, 400);
    const p: any = await db().prepare('SELECT * FROM profiles WHERE id=?').bind(r.profile).first();
    if (!active(p) || !capabilities(p).appointments)
      return json({ error: 'Option Pro inactive' }, 403);
    if (r.status === 'confirmed') return json({ ok: true });
    const busy = await db()
      .prepare('SELECT slot FROM bookings WHERE profile=? AND slot LIKE ?')
      .bind(p.id, r.slot.slice(0, 10) + '%')
      .all();
    if (
      !availableSlots(
        JSON.parse(p.data),
        r.slot.slice(0, 10),
        r.duration,
        busy.results.map((x: any) => x.slot),
      ).includes(r.slot)
    )
      return json({ error: 'Créneau devenu indisponible' }, 409);
    try {
      await db().batch([
        ...blocks(r.slot, r.duration).map((slot, i) =>
          db()
            .prepare(
              'INSERT INTO bookings(id,profile,slot) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM requests WHERE id=? AND notification_revision=?)',
            )
            .bind(r.id + ':' + i, r.profile, slot, r.id, r.notification_revision || 0),
        ),
        update,
        ...notice,
      ]);
    } catch {
      return json({ error: 'Ce créneau chevauche un rendez-vous confirmé' }, 409);
    }
  } else {
    await db().batch([
      db()
        .prepare(
          'DELETE FROM bookings WHERE (id=? OR id LIKE ?) AND EXISTS(SELECT 1 FROM requests WHERE id=? AND notification_revision=?)',
        )
        .bind(r.id, r.id + ':%', r.id, r.notification_revision || 0),
      update,
      ...notice,
    ]);
  }
  return json({ ok: true });
}

export async function deleteContact(b: Action<'deleteContact'>, user: DataUser) {
  const result = await db()
    .prepare(
      "DELETE FROM requests WHERE id=? AND kind='contact' AND profile IN (SELECT id FROM profiles WHERE owner=?)",
    )
    .bind(b.id, user.userId)
    .run();
  if (!result.meta.changes) return json({ error: 'Contact introuvable' }, 404);
  return json({ ok: true });
}
