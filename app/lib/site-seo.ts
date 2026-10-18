import type { Metadata } from 'next';

export const SITE_URL = 'https://soralink.link';
export const HOME_FR = SITE_URL + '/';
export const HOME_AR = SITE_URL + '/?lang=ar';
export const HOME_LANGUAGES = { fr: HOME_FR, ar: HOME_AR, 'x-default': HOME_FR };
export const HOME_TITLE = 'SoraLink — Carte de visite digitale NFC au Maroc';
export const HOME_DESCRIPTION =
  'Créez votre carte de visite digitale au Maroc : coordonnées, catalogue, photos et rendez-vous dans un seul lien. Partagez par carte NFC, QR code ou WhatsApp.';

export function homeMetadata(params: Record<string, string | string[] | undefined>): Metadata {
  const ar = params.lang === 'ar';
  if (params.app !== undefined || params.tab !== undefined)
    return {
      title: ar ? 'الحساب ديالي — SoraLink' : 'Mon espace — SoraLink',
      robots: { index: false, follow: false },
    };
  const title = ar ? 'SoraLink — كارط ڤيزيت رقمية NFC فالمغرب' : HOME_TITLE;
  const description = ar
    ? 'صايب الكارط الرقمية ديالك فالمغرب: معلومات التواصل، الكاتالوگ، التصاور والمواعيد فرابط واحد. شاركها بكارط NFC، كود QR ولا واتساب.'
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
          url: SITE_URL + '/og-soralink.png',
          width: 1200,
          height: 630,
          alt: ar
            ? 'SoraLink — الكارط الرقمية ديالك'
            : 'SoraLink — carte de visite digitale NFC et QR',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SITE_URL + '/og-soralink.png'],
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
