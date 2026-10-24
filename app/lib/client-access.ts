import { profileKind } from './profile-identity';
import { capabilities } from './offers';
import { readClientAccess, clientSectionKeys, type ClientSection } from './client-access-config';
import { normalizeSchedule } from './schedule';
import { catalogContentIssue, catalogRights } from './catalog-menu';
import { designSettings } from './card-design';
import { profileLinks } from './profile-links';
export const clientSectionLabels: Record<ClientSection, [string, string]> = {
  coordinates: ['Identité', 'الهوية'],
  interface: ['Logo et modèle', 'اللوگو والستايل'],
  actions: ['Coordonnées', 'معلومات التواصل'],
  links: ['Réseaux et liens', 'مواقع التواصل والروابط'],
  content: ['Produits et services', 'المنتجات والخدمات'],
  contacts: ['Mes contacts', 'الكونطاكت ديالي'],
  requests: ['Mes demandes', 'الطلبات ديالي'],
  schedule: ['Mon agenda', 'الأجندة ديالي'],
  share: ['Partager ma carte', 'شارك الكارط ديالي'],
};
export function clientSections(profile?: any) {
  const config = readClientAccess(profile),
    rights = capabilities(profile);
  return clientSectionKeys.filter(
    (key) =>
      config.sections[key] !== false &&
      (key !== 'content' || rights.catalogue) &&
      (!['contacts', 'requests'].includes(key) || rights.activity) &&
      (key !== 'schedule' ||
        rights.appointments ||
        (rights.legacy && rights.activity && config.modules.appointments !== false)),
  );
}
export function clientSectionAllowed(profile: any, key: ClientSection) {
  return clientSections(profile).includes(key);
}
export function normalizeClientTab(tab: string) {
  if (tab === 'profile') return 'coordinates';
  if (tab === 'sections') return 'interface';
  if (['catalogue', 'promotions', 'media'].includes(tab)) return 'content';
  return tab;
}
// Section visibility governs access to its editor as well as navigation. Public visibility is separate.
export function clientEditIssue(profile: any, incoming: any, previous: any, published: boolean) {
  const visible = clientSections(profile),
    allowed = (key: ClientSection) => visible.includes(key);
  const changed = (keys: string[], a = incoming, b = previous) =>
    keys.some((key) => JSON.stringify(a[key] ?? '') !== JSON.stringify(b[key] ?? ''));
  if (
    !allowed('coordinates') &&
    (changed(['name', 'business', 'job', 'bio']) || profileKind(incoming) !== profileKind(previous))
  )
    return true;
  if (
    !allowed('interface') &&
    (changed(['avatar', 'cover']) ||
      JSON.stringify(designSettings({ ...previous, ...incoming })) !==
        JSON.stringify(designSettings(previous)))
  )
    return true;
  if (!allowed('actions') || !allowed('links')) {
    const direct = (kind: string) => ['phone', 'whatsapp', 'email', 'address'].includes(kind);
    for (const group of ['actions', 'links'] as const)
      if (!allowed(group)) {
        const select = (data: any) =>
          profileLinks(data).filter((link) => direct(link.kind) === (group === 'actions'));
        if (JSON.stringify(select(incoming)) !== JSON.stringify(select(previous))) return true;
      }
    if (!allowed('actions') && changed(['hidePhone', 'hideEmail', 'hideLocation', 'hideWhatsApp']))
      return true;
    if (!allowed('links') && changed(['hideSocial', 'socialOrder'])) return true;
  }
  if (!allowed('schedule')) {
    const keys = ['hours', 'closures', 'appointmentServices', 'breakStart', 'breakEnd'];
    if (changed(keys, normalizeSchedule(incoming), normalizeSchedule(previous))) return true;
  }
  if (
    !allowed('content') &&
    catalogContentIssue(incoming, previous, { ...catalogRights(profile), enabled: false })
  )
    return true;
  if (
    !visible.some((key) =>
      ['coordinates', 'interface', 'actions', 'links', 'content'].includes(key),
    ) &&
    published !== !!profile?.published
  )
    return true;
  return false;
}
