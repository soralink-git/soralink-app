import Admin from './ui';
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams;
  return <Admin initialArabic={params.lang === 'ar'} />;
}
