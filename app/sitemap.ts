import type { MetadataRoute } from 'next';
import { HOME_FR, HOME_AR, SITE_URL } from './lib/site-seo';

// Only platform pages are advertised; no customer or account data is enumerated.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: HOME_FR },
    { url: HOME_AR },
    { url: SITE_URL + '/conditions' },
    { url: SITE_URL + '/confidentialite' },
  ];
}
