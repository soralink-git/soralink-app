import { selectedPlan, accountPath } from '../../lib/journey-links';
import { identity } from '../../lib/server';
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
        const { admin } = await identity();
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
