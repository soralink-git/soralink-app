import { publicCardPath } from './public-address';
export const visitSources = ['qr', 'nfc', 'direct'] as const;
export function visitSource(value: unknown): (typeof visitSources)[number] {
  return value === 'qr' || value === 'nfc' ? value : 'direct';
}
export function trackedCardURL(origin: string, id: string, name = '', source: 'qr' | 'nfc') {
  const url = new URL(publicCardPath(id, name), origin);
  url.searchParams.set('src', source);
  return url.href;
}
