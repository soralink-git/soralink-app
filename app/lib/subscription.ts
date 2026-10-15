export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 15;
export function trialExpiry(now = Date.now()) {
  return new Date(now + TRIAL_DAYS * 86400000).toISOString();
}
export function active(profile: any, now = Date.now()) {
  if (!profile || !['trial', 'active'].includes(profile.state) || !profile.expires) return false;
  const expires = Date.parse(profile.expires);
  const grace = profile.state === 'active' ? GRACE_DAYS * 86400000 : 0;
  return Number.isFinite(expires) && expires + grace > now;
}
