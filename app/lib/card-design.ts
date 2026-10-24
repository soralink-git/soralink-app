import { BRAND } from './brand';
import { appearance, normalizeAppearance } from './personalization';
import { applyCardStyle, applyCardTheme, cardPalettes, cardStyles } from './card-styles';
export const sectionLabels: Record<string, [string, string]> = {
  coordinates: ['Coordonnées', 'معلومات التواصل'],
  social: ['Réseaux sociaux', 'مواقع التواصل'],
  promotions: ['Promotions', 'العروض'],
  services: ['Produits et services', 'المنتجات والخدمات'],
  photos: ['Galerie photos', 'التصاور'],
  pdf: ['Catalogue PDF', 'كاتالوگ PDF'],
  video: ['Vidéo', 'الفيديو'],
  links: ['Site web', 'الموقع'],
  appointments: ['Rendez-vous', 'المواعيد'],
};
export const designKeys = [
  'template',
  'color',
  'cardTheme',
  'cardFont',
  'buttonShape',
  'avatarShape',
  'fondColor',
  'blockColor',
  'textColor',
  'buttonColor',
  'textSize',
  'buttonSize',
  'buttonStyle',
  'serviceButtonMode',
  'backgroundPhoto',
  'backgroundOpacity',
  'sectionOrder',
  'hiddenSections',
  'sectionTitles',
] as const;
const fixedKeys = [
  'backgroundPhoto',
  'backgroundOpacity',
  'sectionOrder',
  'hiddenSections',
  'sectionTitles',
  'textSize',
] as const;
export function designSettings(data: any) {
  const normalized = normalizeAppearance(data);
  return Object.fromEntries(
    designKeys.map((key) => [
      key,
      key === 'template'
        ? data.template || 'Professionnel'
        : key === 'color'
          ? data.color || BRAND.orange
          : normalized[key],
    ]),
  );
}
const same = (a: any, b: any, keys: readonly string[]) =>
  keys.every((key) => JSON.stringify(a[key]) === JSON.stringify(b[key]));
export function clientDesignAllowed(incoming: any, previous: any = null) {
  const baseline = { color: BRAND.orange, cardTheme: 'dark', buttonShape: 'pill', ...previous };
  const before = designSettings(baseline),
    after = designSettings({ ...baseline, ...incoming });
  if (!same(before, after, fixedKeys)) return false;
  const bases = [baseline, ...cardStyles.map((style) => applyCardStyle(baseline, style.id))];
  for (const base of bases) {
    for (const candidate of [base, applyCardTheme(base, 'light'), applyCardTheme(base, 'dark')]) {
      const custom =
        typeof incoming.color === 'string' && /^#[0-9a-f]{6}$/i.test(incoming.color)
          ? [{ color: incoming.color }]
          : [];
      for (const palette of [null, ...cardPalettes, ...custom]) {
        const variant = palette
          ? { ...candidate, color: palette.color, buttonColor: palette.color }
          : candidate;
        if (
          same(
            after,
            designSettings({ ...variant, serviceButtonMode: after.serviceButtonMode }),
            designKeys,
          )
        )
          return true;
      }
    }
  }
  return false;
}
export function visibleDesignSections(data: any): string[] {
  return appearance(data).order.filter((key: string) => !['photos', 'video'].includes(key));
}
