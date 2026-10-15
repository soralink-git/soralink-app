import { selectedPlan } from '../../lib/journey-links';
import Auth from '../ui';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; offer?: string }>;
}) {
  const params = await searchParams;
  return (
    <Auth reset initialArabic={params.lang === 'ar'} initialOffer={selectedPlan(params.offer)} />
  );
}
