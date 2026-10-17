import { socialOrder } from './card-styles';
export const sectionKeys = [
  'coordinates',
  'social',
  'promotions',
  'services',
  'photos',
  'pdf',
  'video',
  'links',
  'appointments',
] as const;
export function appearance(d: any) {
  const theme = ['light', 'dark', 'sand'].includes(d.cardTheme) ? d.cardTheme : 'light';
  const font = ['modern', 'classic', 'simple'].includes(d.cardFont) ? d.cardFont : 'modern';
  const shape = ['rounded', 'square', 'pill'].includes(d.buttonShape) ? d.buttonShape : 'rounded';
  const order = [
    ...new Set<string>(
      (Array.isArray(d.sectionOrder) ? d.sectionOrder : []).filter((k: any) =>
        sectionKeys.includes(k),
      ),
    ),
  ];
  const hidden = Array.isArray(d.hiddenSections)
    ? d.hiddenSections.filter((k: any) => sectionKeys.includes(k))
    : [];
  return {
    backgroundPhoto:
      typeof d.backgroundPhoto === 'string' &&
      (/^\/api\/upload\?key=[a-f0-9-]{36}$/.test(d.backgroundPhoto) ||
        /^data:image\/(webp|png|jpeg);base64,[a-zA-Z0-9+/=]+$/.test(d.backgroundPhoto))
        ? d.backgroundPhoto
        : '',
    backgroundOpacity:
      typeof d.backgroundOpacity === 'number' && Number.isFinite(d.backgroundOpacity)
        ? Math.max(0, Math.min(100, d.backgroundOpacity))
        : 35,
    theme,
    font,
    shape,
    fondColor: /^#[0-9a-f]{6}$/i.test(d.fondColor || '') ? d.fondColor : '',
    blockColor: /^#[0-9a-f]{6}$/i.test(d.blockColor || '') ? d.blockColor : '',
    textColor: /^#[0-9a-f]{6}$/i.test(d.textColor || '') ? d.textColor : '',
    buttonColor: /^#[0-9a-f]{6}$/i.test(d.buttonColor || '') ? d.buttonColor : '',
    textSize: ['normal', 'large', 'extra'].includes(d.textSize) ? d.textSize : 'normal',
    buttonSize: d.buttonSize === 'large' ? 'large' : 'normal',
    buttonStyle: d.buttonStyle === 'outline' ? 'outline' : 'filled',
    order: [...order, ...sectionKeys.filter((k) => !order.includes(k))],
    hidden,
    avatarShape: d.avatarShape === 'square' ? 'square' : 'circle',
    hidePhone: d.hidePhone === true,
    hideEmail: d.hideEmail === true,
    hideLocation: d.hideLocation === true,
    hideSocial: d.hideSocial === true,
    hideWhatsApp: d.hideWhatsApp === true,
  };
}
export function sectionTitles(value: any) {
  const out: Record<string, Record<string, string>> = { fr: {}, ar: {} };
  for (const lang of ['fr', 'ar'])
    for (const key of sectionKeys) {
      const title = value?.[lang]?.[key];
      if (typeof title === 'string') out[lang][key] = title.trim().slice(0, 120);
    }
  return out;
}
export function normalizeAppearance(d: any) {
  const a = appearance(d);
  return {
    ...d,
    sectionTitles: sectionTitles(d.sectionTitles),
    backgroundPhoto: a.backgroundPhoto,
    backgroundOpacity: a.backgroundOpacity,
    fondColor: a.fondColor,
    blockColor: a.blockColor,
    textColor: a.textColor,
    buttonColor: a.buttonColor,
    textSize: a.textSize,
    buttonSize: a.buttonSize,
    buttonStyle: a.buttonStyle,
    cardTheme: a.theme,
    cardFont: a.font,
    buttonShape: a.shape,
    socialOrder: socialOrder(d.socialOrder),
    sectionOrder: a.order,
    hiddenSections: a.hidden,
    avatarShape: a.avatarShape,
    hidePhone: a.hidePhone,
    hideEmail: a.hideEmail,
    hideLocation: a.hideLocation,
    hideSocial: a.hideSocial,
    hideWhatsApp: a.hideWhatsApp,
  };
}
