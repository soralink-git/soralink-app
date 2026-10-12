import { authActionSchema, readValidatedJSON, inputErrorResponse } from '../../lib/api-validation';
import { authFailure } from '../../lib/auth-errors';
import { authClient } from '../../lib/supabase';
import { json, identity } from '../../lib/server';
import { cookies } from 'next/headers';
import { getChatGPTUser } from '../../chatgpt-auth';
function failed(error: any, action: string) {
  const result = authFailure(error);
  console.warn('soralink_auth_error', {
    action: ['login', 'signup', 'reset', 'resend', 'password'].includes(action) ? action : 'other',
    code: result.providerCode,
    status: result.providerStatus,
    reference: result.reference,
  });
  return json(
    { error: result.error, errorAr: result.errorAr, reference: result.reference },
    result.status,
  );
}
export async function GET() {
  try {
    const { user } = await identity();
    return json({ authenticated: !!user, email: user?.email || null });
  } catch {
    return json({ error: 'Vérification de session indisponible' }, 503);
  }
}
export async function POST(req: Request) {
  try {
    if (req.headers.get('origin') !== new URL(req.url).origin)
      return json({ error: 'Accès refusé' }, 403);
    const b = await readValidatedJSON(req, authActionSchema, 10000);
    if (b.action === 'legacy') {
      const user = await getChatGPTUser();
      if (!user) return json({ error: 'Connexion ChatGPT requise' }, 401);
      (await cookies()).set('soratap_legacy', '1', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 86400 * 7,
      });
      return json({ ok: true });
    }
    const s = await authClient();
    const base = new URL(req.url).origin;
    if (b.action === 'logout') {
      (await cookies()).delete('soratap_legacy');
      const { error } = await s.auth.signOut({ scope: 'local' });
      if (error) return json({ error: 'Déconnexion impossible. Réessayez.' }, 400);
      return json({ ok: true });
    }
    if (b.action === 'password') {
      const { data, error: authError } = await s.auth.getUser();
      if (authError || !data.user || !data.user.email_confirmed_at)
        return json({ error: 'Ouvrez le lien de récupération reçu par e-mail.' }, 401);
      const { error } = await s.auth.updateUser({ password: b.password });
      if (error) return failed(error, b.action);
      return json({ ok: true, message: 'Mot de passe mis à jour.' });
    }
    const email = b.email;
    if (b.action === 'reset') {
      const { error } = await s.auth.resetPasswordForEmail(email, {
        redirectTo: base + '/auth/callback?next=reset',
      });
      if (error) return failed(error, b.action);
      return json({
        ok: true,
        message: 'Si un compte existe à cette adresse, vous recevrez un lien de récupération.',
      });
    }
    if (b.action === 'resend') {
      const { error } = await s.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: base + '/auth/callback' },
      });
      if (error) return failed(error, b.action);
      return json({
        ok: true,
        message: 'Si une confirmation est en attente, un nouvel e-mail sera envoyé.',
      });
    }
    if (b.action === 'signup') {
      const { error } = await s.auth.signUp({
        email,
        password: b.password,
        options: { emailRedirectTo: base + '/auth/callback' },
      });
      if (error) return failed(error, b.action);
      return json({
        ok: true,
        message: 'Vérifiez votre boîte e-mail pour confirmer votre inscription.',
      });
    }
    if (b.action === 'login') {
      const { data, error } = await s.auth.signInWithPassword({ email, password: b.password });
      if (error) return failed(error, b.action);
      if (!data.user?.email_confirmed_at) {
        await s.auth.signOut({ scope: 'local' });
        return json({ error: 'Confirmez votre e-mail avant de vous connecter.' }, 403);
      }
      (await cookies()).delete('soratap_legacy');
      return json({ ok: true, redirect: '/?app=1' });
    }
    return json({ error: 'Action inconnue' }, 400);
  } catch (error) {
    const invalid = inputErrorResponse(error);
    if (invalid) return invalid;
    return json({ error: 'Service de connexion indisponible. Réessayez.' }, 503);
  }
}
