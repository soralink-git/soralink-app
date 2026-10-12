import { appearance } from './personalization';
import { whatsappNumber } from './whatsapp-notification';
export function contactCard(profile: any) {
  if (!profile || !profile.published) return null;
  const d = JSON.parse(profile.data),
    a = appearance(d);
  const phone = a.hidePhone || a.hidden.includes('coordinates') ? '' : String(d.phone || '').trim();
  if (!String(d.name || '').trim() || !whatsappNumber(phone)) return null;
  return {
    id: profile.id,
    name: String(d.name).trim().slice(0, 120),
    phone: phone.slice(0, 40),
    email: a.hideEmail
      ? ''
      : String(d.email || '')
          .trim()
          .slice(0, 254),
    business: String(d.business || '').slice(0, 120),
  };
}
