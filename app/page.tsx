import App from './ui';
import { selectedPlan } from './lib/journey-links';
import { manifestPath } from './lib/pwa-manifest';
import { homeMetadata, websiteStructuredData } from './lib/site-seo';
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return { ...homeMetadata(params), manifest: manifestPath(params.lang === 'ar') };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialTab = typeof params.tab === 'string' ? params.tab : undefined;
  const workspaceMode = params.app !== undefined || params.tab !== undefined;
  return (
    <>
      {!workspaceMode && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
      )}
      <App
        key={workspaceMode ? 'workspace' : 'home'}
        initialArabic={params.lang === 'ar'}
        initialOffer={selectedPlan(params.offer)}
        workspaceMode={workspaceMode}
        initialTab={initialTab}
      />
    </>
  );
}
