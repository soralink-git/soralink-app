export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const ACTIVITY_SYNC_MS = 15 * 1000;
export const SESSION_COOKIE = '__Host-soralink-session';
export const REMEMBERED_EMAIL_KEY = 'soralink_remembered_email';
export function sessionIsActive(expires: number, now = Date.now()) {
  return Number.isFinite(expires) && expires > now;
}
