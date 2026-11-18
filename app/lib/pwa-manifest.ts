import { BRAND } from './brand';

export function manifestPath(ar = false) {
  return '/api/manifest?lang=' + (ar ? 'ar' : 'fr');
}

export function appManifest(ar = false) {
  return {
    name: 'SoraLink',
    short_name: 'SoraLink',
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
      : 'Votre carte digitale, catalogue et rendez-vous SoraLink.',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
