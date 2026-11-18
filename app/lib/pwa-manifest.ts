import { BRAND } from './brand';

export function manifestPath(ar = false) {
  return '/api/manifest?lang=' + (ar ? 'ar' : 'fr');
}

export function appManifest(ar = false) {
  return {
    name: 'SoraConnect',
    short_name: 'SoraConnect',
    id: '/',
    scope: '/',
    start_url: '/?app=1&lang=' + (ar ? 'ar' : 'fr'),
    lang: ar ? 'ar' : 'fr',
    dir: ar ? 'rtl' : 'ltr',
    display: 'standalone',
    background_color: BRAND.charcoal,
    theme_color: BRAND.charcoal,
    description: ar
      ? 'الكارط الرقمية، الكاتالوگ والمواعيد ديالك مع SoraLink.'
      : 'Votre carte digitale, catalogue et rendez-vous SoraConnect.',
    icons: [
      {
        src: '/icons/icon-192.png?v=reference-02',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png?v=reference-02',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-512.png?v=reference-02',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
