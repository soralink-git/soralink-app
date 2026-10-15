import Auth from './ui';
import { identity } from '../lib/server';
import { selectedPlan, accountPath } from '../lib/journey-links';
import { redirect } from 'next/navigation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let signedIn = false;
  let admin = false;
  try {
    const session = await identity();
    signedIn = !!session.user;
    admin = session.admin;
  } catch {}
  if (signedIn && !params.error)
    redirect(accountPath(admin, params.lang === 'ar', selectedPlan(params.offer)));
  return (
    <Auth
      initialMode={params.mode === 'signup' ? 'signup' : 'login'}
      initialArabic={params.lang === 'ar'}
      initialOffer={selectedPlan(params.offer)}
    />
  );
}
