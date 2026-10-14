import App from './ui';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialTab = typeof params.tab === 'string' ? params.tab : undefined;
  return (
    <App
      workspaceMode={params.app !== undefined || params.tab !== undefined}
      initialTab={initialTab}
    />
  );
}
