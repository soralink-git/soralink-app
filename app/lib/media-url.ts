// A stored media reference is always an uploaded key or one of the built-in
// demo assets, never an external URL. Shared by save validation and the public
// projection so an old bad value can never reach <img>, <iframe> or CSS.
export const MEDIA_FIELDS = ['pdf', 'avatar', 'cover', 'backgroundPhoto'] as const;
const MEDIA_URL = /^\/api\/upload\?key=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
// Same-origin files shipped in public/, used by the built-in demo card only.
const STATIC_ASSETS = new Set(['/favicon.svg', '/demo-profile-cover.svg']);
export function isMediaUrl(value: unknown): value is string {
  return typeof value === 'string' && MEDIA_URL.test(value);
}
export function isAllowedMedia(value: unknown): value is string {
  return isMediaUrl(value) || (typeof value === 'string' && STATIC_ASSETS.has(value));
}
