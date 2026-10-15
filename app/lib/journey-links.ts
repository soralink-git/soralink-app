export const plans = ['Digital', 'Pack', 'Accompagnement', 'Pro'] as const;
export function selectedPlan(value: unknown): (typeof plans)[number] | undefined {
  return typeof value === 'string' && plans.includes(value as (typeof plans)[number])
    ? (value as (typeof plans)[number])
    : undefined;
}
export function workspacePath(ar = false, offer?: unknown) {
  const params = new URLSearchParams({ app: '1' });
  if (ar) params.set('lang', 'ar');
  const plan = selectedPlan(offer);
  if (plan) {
    params.set('offer', plan);
    params.set('tab', 'orders');
  }
  return '/?' + params;
}
export function accountPath(admin: boolean, ar = false, offer?: unknown) {
  return admin ? '/admin?lang=' + (ar ? 'ar' : 'fr') : workspacePath(ar, offer);
}
export function adminSignInPath(ar = false) {
  return '/admin/connexion?lang=' + (ar ? 'ar' : 'fr');
}
export function signupPath(ar = false, offer?: unknown, connected = false) {
  if (connected) return workspacePath(ar, offer);
  const params = new URLSearchParams({ mode: 'signup' });
  if (ar) params.set('lang', 'ar');
  const plan = selectedPlan(offer);
  if (plan) params.set('offer', plan);
  return '/auth?' + params;
}
export function offerLabel(plan: string, ar = false) {
  const labels: Record<string, [string, string]> = {
    Digital: ['Digital', 'الديجيتال'],
    Pack: ['Pack', 'الپاك'],
    Accompagnement: ['Clé en main', 'خدمة كاملة'],
    Pro: ['Option Rendez-vous', 'خيار المواعيد'],
  };
  return labels[plan]?.[ar ? 1 : 0] || plan;
}
export function languagePath(currentUrl: string, ar: boolean): string {
  const url = new URL(currentUrl, 'https://soralink.link');
  url.searchParams.set('lang', ar ? 'ar' : 'fr');
  return url.pathname + url.search + url.hash;
}
