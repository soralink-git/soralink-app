import Auth from '../../auth/ui';
import { identity } from '../../lib/server';
import { accountPath } from '../../lib/journey-links';
import { redirect } from 'next/navigation';

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  let admin = false;
  try {
    admin = (await identity()).admin;
  } catch {}
  if (admin) redirect(accountPath(true, params.lang === 'ar'));
  return <Auth administrator initialArabic={params.lang === 'ar'} />;
}
