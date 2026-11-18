import GroupSite from '../group-site';
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const ar = p.lang === 'ar';
  return {
    title: ar ? 'SoraPrint — مجموعة SoraLink' : 'SoraPrint — Groupe SoraLink',
    description: ar
      ? 'طباعة ومنتوجات شخصية فوجدة، المغرب. عرض ثمن حسب المشروع.'
      : 'Impression et personnalisation à Oujda, Maroc. Votre projet sur devis.',
    alternates: {
      canonical: '/soraprint' + (ar ? '?lang=ar' : ''),
      languages: { fr: '/soraprint', ar: '/soraprint?lang=ar' },
    },
    openGraph: {
      title: 'SoraPrint — Groupe SoraLink',
      description: ar
        ? 'طباعة ومنتوجات شخصية فوجدة، المغرب. عرض ثمن حسب المشروع.'
        : 'Impression et personnalisation à Oujda, Maroc. Votre projet sur devis.',
      images: ['/brand/soraprint-social.png?v=reference-02'],
    },
  };
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  return <GroupSite division="Print" ar={p.lang === 'ar'} />;
}
