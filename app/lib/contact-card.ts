import { profileName, profileKind } from './profile-identity';
import { appearance } from './personalization';
import { whatsappNumber } from './whatsapp-notification';
export function contactCard(profile: any) {
  if (!profile || !profile.published) return null;
  const d = JSON.parse(profile.data),
    a = appearance(d);
  const phone = a.hidePhone || a.hidden.includes('coordinates') ? '' : String(d.phone || '').trim();
  if (!profileName(d) || !whatsappNumber(phone)) return null;
  return {
    id: profile.id,
    name: profileName(d).slice(0, 120),
    phone: phone.slice(0, 40),
    email: a.hideEmail
      ? ''
      : String(d.email || '')
          .trim()
          .slice(0, 254),
    business: profileKind(d) === 'business' ? '' : String(d.business || '').slice(0, 120),
  };
}
