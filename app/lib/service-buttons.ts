import type { CSSProperties } from 'react';
import { primaryColor } from './card-styles';
import { buttonForeground } from './color-contrast';
import { BRAND } from './brand';
export const serviceButtonModes = ['official', 'card'] as const;
// Service identity colors, used only as contact-button backgrounds.
// Generic actions (phone, email, address, website and reviews) have no assigned brand color.
export const serviceColors: Readonly<Record<string, string>> = {
  whatsapp: '#25d366',
  facebook: '#0866ff',
  instagram: '#e4405f',
  linkedin: '#0a66c2',
  youtube: '#ff0033',
  tiktok: '#000000',
  x: '#000000',
};
export function serviceButtonMode(data: any) {
  return data?.serviceButtonMode === 'card' ? 'card' : 'official';
}
export function serviceButtonStyle(data: any, kind: string): CSSProperties {
  const cardColor = primaryColor(data?.buttonColor) || primaryColor(data?.color) || BRAND.orange;
  const background =
    (serviceButtonMode(data) === 'official' &&
      Object.hasOwn(serviceColors, kind) &&
      serviceColors[kind]) ||
    cardColor;
  return {
    '--service-bg': background,
    '--service-fg': buttonForeground(background),
  } as CSSProperties;
}
