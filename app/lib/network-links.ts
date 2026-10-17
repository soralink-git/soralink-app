import { socialOrder } from './card-styles';
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
export type LinkPlatform = (typeof linkPlatforms)[number];
export function activeNetworkLinks(data: any) {
  const keys = [...socialOrder(data.socialOrder), 'website', 'googleReview'];
  return keys
    .map((key) => linkPlatforms.find((p) => p.key === key)!)
    .filter(
      (platform) => platform && typeof data[platform.key] === 'string' && data[platform.key].trim(),
    );
}
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
export function moveActiveSocialLink(data: any, source: string, target: string) {
  const ordered = socialOrder(data.socialOrder);
  const active = ordered.filter((key) => typeof data[key] === 'string' && data[key].trim());
  const from = active.indexOf(source),
    to = active.indexOf(target);
  if (from < 0 || to < 0 || from === to) return data;
  active.splice(from, 1);
  active.splice(to, 0, source);
  return { ...data, socialOrder: [...active, ...ordered.filter((key) => !active.includes(key))] };
}
