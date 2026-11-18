import type { Metadata } from 'next';

export const SITE_URL = 'https://soralink.link';
export const HOME_FR = SITE_URL + '/';
export const HOME_AR = SITE_URL + '/?lang=ar';
export const HOME_LANGUAGES = { fr: HOME_FR, ar: HOME_AR, 'x-default': HOME_FR };
export const HOME_TITLE = 'Groupe SoraLink — Impression et solutions numériques au Maroc';
export const HOME_DESCRIPTION =
  'SoraLink réunit SoraPrint et SoraConnect à Oujda : impression, personnalisation, cartes digitales et solutions numériques au Maroc.';

export function homeMetadata(params: Record<string, string | string[] | undefined>): Metadata {
  const ar = params.lang === 'ar';
  if (params.app !== undefined || params.tab !== undefined)
    return {
      title: ar ? 'الحساب ديالي — SoraLink' : 'Mon espace — SoraLink',
      robots: { index: false, follow: false },
    };
  const title = ar ? 'مجموعة SoraLink — الطباعة والحلول الرقمية فالمغرب' : HOME_TITLE;
  const description = ar
    ? 'مجموعة SoraLink كتجمع SoraPrint وSoraConnect فوجدة: الطباعة، المنتوجات الشخصية والبطاقات والحلول الرقمية فالمغرب.'
    : HOME_DESCRIPTION;
  const url = ar ? HOME_AR : HOME_FR;
  return {
    title,
    description,
    alternates: { canonical: url, languages: HOME_LANGUAGES },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: 'SoraLink',
      title,
      description,
      url,
      locale: ar ? 'ar_MA' : 'fr_MA',
      alternateLocale: [ar ? 'fr_MA' : 'ar_MA'],
      images: [
        {
          url: SITE_URL + '/brand/soralink-social.png?v=reference-02',
          width: 1200,
          height: 630,
          alt: ar
            ? 'مجموعة SoraLink — SoraPrint وSoraConnect'
            : 'Groupe SoraLink — SoraPrint et SoraConnect',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SITE_URL + '/brand/soralink-social.png?v=reference-02'],
    },
  };
}

export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': HOME_FR + '#website',
      url: HOME_FR,
      name: 'SoraLink',
      inLanguage: ['fr', 'ar'],
      publisher: { '@id': HOME_FR + '#organization' },
    },
    { '@type': 'Organization', '@id': HOME_FR + '#organization', name: 'SoraLink', url: HOME_FR },
  ],
};
