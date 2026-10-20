import { selectedPlan, accountPath } from '../../lib/journey-links';
import { isAdministrator } from '../../lib/server';
import { startAppSession } from '../../lib/idle-session';
import { authClient } from '../../lib/supabase';
function redirect(url: string) {
  return new Response(null, {
    status: 303,
    headers: { Location: url, 'Cache-Control': 'no-store' },
  });
}
export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get('code');
  const ar = u.searchParams.get('lang') === 'ar';
  const offer = selectedPlan(u.searchParams.get('offer'));
  if (code) {
    try {
      const s = await authClient();
      const { error } = await s.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data, error: userError } = await s.auth.getUser();
        if (userError || !data.user?.email_confirmed_at) throw new Error('Confirmation required');
        await startAppSession('sb:' + data.user.id);
        const admin = isAdministrator(data.user.email);
        return redirect(
          u.origin +
            (u.searchParams.get('next') === 'reset'
              ? '/auth/reset?lang=' + (ar ? 'ar' : 'fr') + (offer ? '&offer=' + offer : '')
              : accountPath(admin, ar, offer)),
        );
      }
    } catch {}
  }
  return redirect(
    u.origin +
      '/auth?error=confirmation&lang=' +
      (ar ? 'ar' : 'fr') +
      (offer ? '&offer=' + offer : ''),
  );
}
