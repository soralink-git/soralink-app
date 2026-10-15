import App from './ui';
import { selectedPlan } from './lib/journey-links';
import { manifestPath } from './lib/pwa-manifest';
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return { manifest: manifestPath(params.lang === 'ar') };
}
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
