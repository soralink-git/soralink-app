import { permanentRedirect } from 'next/navigation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  permanentRedirect('/soraprint' + (p.lang === 'ar' ? '?lang=ar' : ''));
}
