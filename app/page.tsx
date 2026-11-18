import App from './ui';
import GroupSite from './group-site';
import GroupLegacyLinks from './group-legacy-links';
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
  if (
    params.app === undefined &&
    params.tab === undefined &&
    params.offer === undefined &&
    params.offre === undefined
  )
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <GroupLegacyLinks />
        <GroupSite ar={params.lang === 'ar'} />
      </>
    );
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
