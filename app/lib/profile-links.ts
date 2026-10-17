import { socialOrder } from './card-styles';
import { networkLinkURL, linkPlatforms } from './network-links';
import { whatsappNumber } from './whatsapp-notification';
export const PROFILE_LINK_LIMIT = 40;
export const profileLinkKinds = [
  'phone',
  'whatsapp',
  'email',
  'address',
  'website',
  'googleReview',
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'youtube',
  'x',
] as const;
export type ProfileLinkKind = (typeof profileLinkKinds)[number];
export type ProfileLink = {
  id: string;
  kind: ProfileLinkKind;
  value: string;
  labelFr: string;
  labelAr: string;
  visible: boolean;
  mapsUrl?: string;
  mapDestination?: string;
};
const isSocial = (kind: string) =>
  linkPlatforms.some((p) => p.key === kind && p.group === 'social');
export function profileLinks(data: any): ProfileLink[] {
  if (Array.isArray(data.profileLinks))
    return data.profileLinks
      .slice(0, PROFILE_LINK_LIMIT)
      .filter(
        (entry: any) =>
          entry &&
          typeof entry.id === 'string' &&
          profileLinkKinds.includes(entry.kind) &&
          typeof entry.value === 'string',
      )
      .map((entry: any) => ({
        id: entry.id,
        kind: entry.kind,
        value: entry.value,
        labelFr: typeof entry.labelFr === 'string' ? entry.labelFr.slice(0, 80) : '',
        labelAr: typeof entry.labelAr === 'string' ? entry.labelAr.slice(0, 80) : '',
        ...(entry.kind === 'address'
          ? {
              mapsUrl: typeof entry.mapsUrl === 'string' ? entry.mapsUrl : '',
              mapDestination: typeof entry.mapDestination === 'string' ? entry.mapDestination : '',
            }
          : {}),
        visible: entry.visible !== false,
      }));
  const ordered = [
    'phone',
    'whatsapp',
    'email',
    'address',
    ...socialOrder(data.socialOrder),
    'website',
    'googleReview',
  ] as ProfileLinkKind[];
  return ordered
    .filter(
      (kind) =>
        (typeof data[kind] === 'string' && data[kind].trim()) ||
        (kind === 'address' && (data.mapsUrl || data.mapDestination)),
    )
    .map((kind) => ({
      id: 'legacy-' + kind,
      kind,
      value: String(data[kind] || data.mapDestination || data.mapsUrl || ''),
      labelFr: '',
      labelAr: '',
      visible: !(
        {
          phone: data.hidePhone,
          email: data.hideEmail,
          whatsapp: data.hideWhatsApp,
          address: data.hideLocation,
        } as any
      )[kind],
      ...(kind === 'address'
        ? { mapsUrl: data.mapsUrl || '', mapDestination: data.mapDestination || '' }
        : {}),
    }));
}
export function profileLinkValue(kind: ProfileLinkKind, value: string) {
  const input = value.trim();
  if (!input || input.length > 4000 || /[\r\n]/.test(input)) return '';
  if (kind === 'phone')
    return /^[+\d\s().-]{5,40}$/.test(input) && input.replace(/\D/g, '').length >= 5 ? input : '';
  if (kind === 'whatsapp') {
    const n = whatsappNumber(input);
    return n ? '+' + n : '';
  }
  if (kind === 'email')
    return input.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) ? input : '';
  if (kind === 'address') return input;
  const url = networkLinkURL(kind, input);
  return url.length <= 4000 ? url : '';
}
export function profileLinkHref(entry: ProfileLink) {
  if (entry.kind === 'phone') {
    const value = profileLinkValue('phone', entry.value);
    return value ? 'tel:' + value.replace(/[^+\d]/g, '') : '';
  }
  if (entry.kind === 'email') {
    const value = profileLinkValue('email', entry.value);
    return value ? 'mailto:' + value : '';
  }
  if (entry.kind === 'whatsapp') {
    const n = whatsappNumber(entry.value);
    return n ? 'https://wa.me/' + n : '';
  }
  if (entry.kind === 'address') {
    const custom = networkLinkURL('website', entry.mapsUrl || '');
    if (custom) {
      const u = new URL(custom);
      if (
        ['maps.app.goo.gl', 'maps.google.com', 'goo.gl'].includes(u.hostname) ||
        (['google.com', 'www.google.com'].includes(u.hostname) && u.pathname.startsWith('/maps'))
      )
        return custom;
    }
    return (
      'https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(entry.mapDestination || entry.value)
    );
  }
  return profileLinkValue(entry.kind, entry.value);
}
export function visibleProfileLinks(data: any): ProfileLink[] {
  const hidden = new Set(data.hiddenSections || []);
  return profileLinks(data).filter((entry) => {
    if (!entry.visible || !profileLinkHref(entry)) return false;
    if (isSocial(entry.kind)) return !data.hideSocial && !hidden.has('social');
    if (entry.kind === 'website') return !hidden.has('links');
    if (hidden.has('coordinates')) return false;
    const flag = (
      {
        phone: 'hidePhone',
        email: 'hideEmail',
        whatsapp: 'hideWhatsApp',
        address: 'hideLocation',
      } as any
    )[entry.kind];
    return !flag || !data[flag];
  });
}
export function replaceProfileLinks(data: any, entries: ProfileLink[]) {
  entries = entries.map((entry) => ({
    ...entry,
    value: profileLinkValue(entry.kind, entry.value) || entry.value,
  }));
  const next = {
    ...data,
    profileLinks: entries,
    ...(!Array.isArray(data.profileLinks)
      ? { hidePhone: false, hideEmail: false, hideWhatsApp: false, hideLocation: false }
      : {}),
  };
  for (const kind of profileLinkKinds)
    next[kind] = entries.find((entry) => entry.kind === kind)?.value || '';
  const address = entries.find((entry) => entry.kind === 'address');
  next.mapsUrl = address?.mapsUrl || '';
  next.mapDestination = address?.mapDestination || '';
  return next;
}
export function moveProfileLink(data: any, source: string, target: string) {
  const entries = profileLinks(data),
    from = entries.findIndex((e) => e.id === source),
    to = entries.findIndex((e) => e.id === target);
  if (from < 0 || to < 0 || from === to) return data;
  const [entry] = entries.splice(from, 1);
  entries.splice(to, 0, entry);
  return replaceProfileLinks(data, entries);
}
export function profileLinkLabel(entry: ProfileLink, ar: boolean) {
  const custom = ar ? entry.labelAr : entry.labelFr;
  if (custom) return custom;
  const labels: Record<string, [string, string]> = {
    phone: ['Téléphone', 'الهاتف'],
    email: ['E-mail', 'الإيميل'],
    address: ['Localisation', 'الموقع'],
    website: ['Site web', 'الموقع'],
    googleReview: ['Avis Google', 'تقييمات Google'],
  };
  return (
    labels[entry.kind]?.[ar ? 1 : 0] ||
    linkPlatforms.find((p) => p.key === entry.kind)?.name ||
    'WhatsApp'
  );
}
export function profileLinkGroup(kind: ProfileLinkKind) {
  return isSocial(kind) ? 'social' : kind === 'website' ? 'links' : 'coordinates';
}
