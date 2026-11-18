import GroupSite from '../group-site';
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const ar = p.lang === 'ar';
  return {
    title: ar ? 'SoraConnect — مجموعة SoraLink' : 'SoraConnect — Groupe SoraLink',
    description: ar
      ? 'بطاقات رقمية، QR، NFC وحلول رقمية فالمغرب.'
      : 'Cartes digitales, QR, NFC et solutions numériques au Maroc.',
    alternates: {
      canonical: '/soraconnect' + (ar ? '?lang=ar' : ''),
      languages: { fr: '/soraconnect', ar: '/soraconnect?lang=ar' },
    },
    openGraph: {
      title: 'SoraConnect — Groupe SoraLink',
      description: ar
        ? 'بطاقات رقمية، QR، NFC وحلول رقمية فالمغرب.'
        : 'Cartes digitales, QR, NFC et solutions numériques au Maroc.',
      images: ['/brand/soraconnect-social.png?v=reference-02'],
    },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  return <GroupSite division="Connect" ar={p.lang === 'ar'} />;
}
