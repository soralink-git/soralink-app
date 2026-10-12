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
  if (code) {
    try {
      const s = await authClient();
      const { error } = await s.auth.exchangeCodeForSession(code);
      if (!error)
        return redirect(
          u.origin + (u.searchParams.get('next') === 'reset' ? '/auth/reset' : '/?app=1'),
        );
    } catch {}
  }
  return redirect(u.origin + '/auth?error=confirmation');
}
