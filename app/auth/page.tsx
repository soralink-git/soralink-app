import Auth from './ui';
import { authClient } from '../lib/supabase';
import { selectedPlan, workspacePath } from '../lib/journey-links';
import { redirect } from 'next/navigation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let signedIn = false;
  try {
    const client = await authClient();
    const { data, error } = await client.auth.getUser();
    signedIn = !error && !!data.user?.email_confirmed_at;
  } catch {}
  if (signedIn && !params.error)
    redirect(workspacePath(params.lang === 'ar', selectedPlan(params.offer)));
  return (
    <Auth
      initialMode={params.mode === 'signup' ? 'signup' : 'login'}
      initialArabic={params.lang === 'ar'}
      initialOffer={selectedPlan(params.offer)}
    />
  );
}
