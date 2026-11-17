import { socialLink } from './social-links';
export const linkPlatforms = [
  {
    key: 'instagram',
    name: 'Instagram',
    group: 'social',
    example: 'https://www.instagram.com/soralink',
  },
  {
    key: 'facebook',
    name: 'Facebook',
    group: 'social',
    example: 'https://www.facebook.com/soralink',
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    group: 'social',
    example: 'https://www.linkedin.com/in/soralink',
  },
  {
    key: 'tiktok',
    name: 'TikTok',
    group: 'social',
    example: 'https://www.tiktok.com/@soralink',
  },
  {
    key: 'youtube',
    name: 'YouTube',
    group: 'social',
    example: 'https://www.youtube.com/@soralink',
  },
  { key: 'x', name: 'X', group: 'social', example: 'https://x.com/soralink' },
  { key: 'website', name: '', group: 'other', example: 'https://exemple.ma' },
  { key: 'googleReview', name: '', group: 'other', example: 'https://g.page/r/…/review' },
] as const;
export function networkLinkURL(key: string, value: string) {
  if (!linkPlatforms.some((platform) => platform.key === key)) return '';
  const input = value.trim();
  if (
    !input ||
    input.length > 4000 ||
    (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input))
  )
    return '';
  return socialLink(
    key,
    /^https?:\/\//i.test(input) ? input : 'https://' + input.replace(/^\/\//, ''),
  );
}
