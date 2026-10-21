import { capabilities } from '../../lib/offers';
import {
  availabilityQuerySchema,
  validateInput,
  inputErrorResponse,
} from '../../lib/api-validation';
import { normalizeAppearance } from '../../lib/personalization';
import { db, json, active } from '../../lib/server';
import { availableSlots, normalizeSchedule } from '../../lib/schedule';
export async function GET(req: Request) {
  try {
    const query = validateInput(
      availabilityQuerySchema,
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const p: any = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(query.id)
      .first();
    if (!p || !active(p) || !capabilities(p).appointments)
      return json({ error: 'Rendez-vous indisponibles' }, 404);
    const saved = JSON.parse(p.data);
    if (normalizeAppearance(saved).hiddenSections.includes('appointments'))
      return json({ error: 'Rendez-vous indisponibles' }, 404);
    const d = normalizeSchedule(saved);
    const index = query.service;
    const s = d.appointmentServices[index];
    if (!s) return json({ error: 'Prestation indisponible' }, 400);
    const date = query.date;
    const busy = await db()
      .prepare('SELECT slot FROM bookings WHERE profile=? AND slot LIKE ?')
      .bind(p.id, date + '%')
      .all();
    return json({
      services: d.appointmentServices,
      slots: availableSlots(
        d,
        date,
        s.duration,
        busy.results.map((b: any) => b.slot),
      ),
      timezone: 'Africa/Casablanca',
    });
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Agenda temporairement indisponible' }, 503);
  }
}
