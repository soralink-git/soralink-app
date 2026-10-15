import App from './ui';
import { selectedPlan } from './lib/journey-links';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialTab = typeof params.tab === 'string' ? params.tab : undefined;
  return (
    <App
      initialArabic={params.lang === 'ar'}
      initialOffer={selectedPlan(params.offer)}
      workspaceMode={params.app !== undefined || params.tab !== undefined}
      initialTab={initialTab}
    />
  );
}
