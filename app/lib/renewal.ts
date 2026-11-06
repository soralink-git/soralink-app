import { mailEnabled, validEmail, type MailEnv } from './notifications';

export const RENEWAL_WINDOWS = [7, 3, 1] as const;
const DAY = 86400000;

export type RenewalStage = 'none' | 'soon' | 'grace' | 'expired';
export type RenewalNotice = { stage: RenewalStage; days: number; until?: string };

// Mirrors active(): a trial has no grace, a paid subscription keeps 15 days.
export function renewalNotice(profile: any, now = Date.now()): RenewalNotice {
  if (!profile || !['trial', 'active'].includes(profile.state) || !profile.expires)
    return { stage: 'none', days: 0 };
  const expires = Date.parse(profile.expires);
  if (!Number.isFinite(expires)) return { stage: 'none', days: 0 };
  if (now < expires) {
    const days = Math.ceil((expires - now) / DAY);
    return days <= 7 ? { stage: 'soon', days } : { stage: 'none', days };
  }
  const grace = profile.state === 'active' ? 15 * DAY : 0;
  if (now < expires + grace)
    return {
      stage: 'grace',
      days: Math.ceil((expires + grace - now) / DAY),
      until: new Date(expires + grace).toISOString(),
    };
  return { stage: 'expired', days: 0 };
}

export function renewalStatement(
  e: MailEnv,
  p: any,
  notice: RenewalNotice,
  stamp = new Date().toISOString(),
) {
  if (!mailEnabled(e) || !validEmail(p.email)) return [];
  if (notice.stage !== 'soon' && notice.stage !== 'grace') return [];
  let data: any = {};
  try {
    data = JSON.parse(p.data);
  } catch {}
  const name = String(data.business || data.name || 'votre carte').slice(0, 120);
  const ar = data.defaultLanguage === 'ar' || data.lang === 'ar';
  const date = String(p.expires).slice(0, 10);
  const site = e.PUBLIC_SITE_URL || 'https://soralink.link';
  const link = new URL('/?app=1&tab=orders&lang=' + (ar ? 'ar' : 'fr'), site).href;
  const days = Math.max(0, notice.days);
  const subject =
    notice.stage === 'soon'
      ? ar
        ? `SoraLink - الاشتراك كيسالي فـ ${days} أيام`
        : `SoraLink - Votre abonnement expire dans ${days} jour${days > 1 ? 's' : ''}`
      : ar
        ? 'SoraLink - الاشتراك سالا: الكارط باقية باينة مؤقتا'
        : 'SoraLink - Abonnement expiré : votre carte reste visible temporairement';
  const body =
    notice.stage === 'soon'
      ? (ar
          ? [
              'السلام عليكم،',
              '',
              `الاشتراك ديال "${name}" كيسالي فـ ${date} (${days} أيام).`,
              'باش تبقى الكارط منشورة بلا انقطاع، جدّد من الحساب ديالك:',
              link,
              '',
              'SoraLink',
            ]
          : [
              'Bonjour,',
              '',
              `L’abonnement de « ${name} » expire le ${date} (dans ${days} jour${days > 1 ? 's' : ''}).`,
              'Pour éviter toute interruption de votre carte publique, renouvelez depuis votre espace :',
              link,
              '',
              'SoraLink',
            ]
        ).join('\n')
      : (ar
          ? [
              'السلام عليكم،',
              '',
              `الاشتراك ديال "${name}" سالا فـ ${date}.`,
              'الكارط باقية باينة للزوار حتى نهاية مدة السماح، ومن بعد غادي تتوقف.',
              'جدّد من الحساب ديالك باش ترجع مباشرة:',
              link,
              '',
              'SoraLink',
            ]
          : [
              'Bonjour,',
              '',
              `L’abonnement de « ${name} » a expiré le ${date}.`,
              'Votre carte publique reste visible pendant la période de grâce, puis sera masquée.',
              'Renouvelez depuis votre espace pour la réactiver immédiatement :',
              link,
              '',
              'SoraLink',
            ]
        ).join('\n');
  const id = `${p.id}:renewal:${notice.stage}:${notice.stage === 'soon' ? days : 'grace'}:${date}`;
  return [
    e.DB.prepare(
      'INSERT OR IGNORE INTO notifications(id,profile,request_id,recipient,subject,body,created,next_attempt) VALUES(?,?,?,?,?,?,?,?)',
    ).bind(id, p.id, '', p.email, subject, body, stamp, stamp),
  ];
}

// Enqueues the reminders that are due; the dispatcher sends them right after.
export async function sendRenewalReminders(e: MailEnv, now = Date.now()) {
  if (!mailEnabled(e)) return 0;
  const rows = await e.DB.prepare(
    "SELECT id,email,state,plan,expires,data FROM profiles WHERE state IN ('trial','active') AND expires IS NOT NULL ORDER BY expires LIMIT 100",
  ).all<any>();
  let queued = 0;
  const stamp = new Date(now).toISOString();
  for (const profile of rows.results || []) {
    const notice = renewalNotice(profile, now);
    if (notice.stage === 'soon' && !RENEWAL_WINDOWS.includes(notice.days as 7 | 3 | 1)) continue;
    if (notice.stage !== 'soon' && notice.stage !== 'grace') continue;
    const statements = renewalStatement(e, profile, notice, stamp);
    if (!statements.length) continue;
    const result = await statements[0].run();
    queued += Number(result?.meta?.changes) || 0;
  }
  return queued;
}
