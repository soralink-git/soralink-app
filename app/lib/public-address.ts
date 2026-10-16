// Keep root application paths unavailable to customer profiles, including future essentials.
const reserved = new Set([
  'admin',
  'api',
  'auth',
  'c',
  'demo',
  'conditions',
  'confidentialite',
  'offline',
  'assets',
  'icons',
  'static',
  'manifest',
  'robots',
  'sitemap',
  'favicon',
  'connexion',
  'inscription',
  'login',
  'logout',
  'contact',
  'support',
  'aide',
  'help',
  'tarifs',
  'pricing',
  'dashboard',
  'app',
  'settings',
  'account',
  'compte',
  'soralink',
  'www',
  'mail',
  'email',
  'notifications',
  'adresse',
  'address',
]);
export function normalizePublicName(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}
export function publicNameError(value: string): 'format' | 'reserved' | null {
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(value)) return 'format';
  return reserved.has(value) ? 'reserved' : null;
}
export function publicCardPath(id: string, name?: string | null) {
  return name && !publicNameError(name)
    ? '/' + encodeURIComponent(name)
    : '/c/' + encodeURIComponent(id);
}
