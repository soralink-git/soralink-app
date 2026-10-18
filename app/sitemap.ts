import type { MetadataRoute } from 'next';
import { HOME_FR, HOME_AR } from './lib/site-seo';

// Only the platform landing pages are advertised; no customer or account data is enumerated.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: HOME_FR }, { url: HOME_AR }];
}
