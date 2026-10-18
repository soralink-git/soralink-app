import { recordedVideoUrl } from './content-media';
export const MAX_PROMOTIONS = 10;
export type Promotion = {
  id: string;
  title: string;
  description: string;
  image: string;
  images: string[];
  video: string;
  recordedVideo: string;
  regularPrice: string;
  promoPrice: string;
  startDate: string;
  endDate: string;
  enabled: boolean;
};
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export function todayMorocco(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
function dateValid(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T12:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
const priceValid = (v: string) => !v || /^\d{1,9}([.,]\d{1,2})?$/.test(v);
export function promotionError(value: unknown): string | null {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length > MAX_PROMOTIONS)
    return 'Vous pouvez ajouter jusqu’à 10 promotions.';
  for (const p of value) {
    if (
      !p ||
      typeof p !== 'object' ||
      typeof p.title !== 'string' ||
      !p.title.trim() ||
      p.title.length > 120
    )
      return 'Renseignez un titre pour chaque promotion (120 caractères maximum).';
    if (typeof p.description === 'string' && p.description.length > 800)
      return 'La description d’une promotion ne doit pas dépasser 800 caractères.';
    const start = text(p.startDate, 30),
      end = text(p.endDate, 30);
    if ((start && !dateValid(start)) || (end && !dateValid(end)))
      return 'Vérifiez les dates de vos promotions.';
    if (start && end && start > end) return 'La fin d’une promotion doit être après son début.';
    const regular = text(p.regularPrice, 30),
      promo = text(p.promoPrice, 30);
    if (!priceValid(regular) || !priceValid(promo))
      return 'Renseignez des prix positifs avec deux décimales maximum.';
    if (regular && promo && Number(promo.replace(',', '.')) > Number(regular.replace(',', '.')))
      return 'Le prix promotionnel ne peut pas dépasser le prix habituel.';
    if (
      p.images !== undefined &&
      (!Array.isArray(p.images) ||
        p.images.length > 10 ||
        p.images.some((v: unknown) => !recordedVideoUrl(v)))
    )
      return 'Ajoutez jusqu’à 10 photos supplémentaires à cette offre.';
    if (p.recordedVideo && !recordedVideoUrl(p.recordedVideo)) return 'Vidéo de l’offre invalide.';
    if (p.video && !youtubeOfferURL(p.video))
      return 'Renseignez un lien YouTube valide pour cette offre.';
    if (p.image && !/^\/api\/upload\?key=[a-f0-9-]{36}$/.test(p.image))
      return 'Ajoutez la photo de votre promotion avec le bouton prévu.';
  }
  return null;
}
export function normalizePromotions(value: unknown): Promotion[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_PROMOTIONS)
    .filter((p) => p && typeof p === 'object')
    .map((p, i) => ({
      id: text(p.id, 80) || 'promo-' + i,
      title: text(p.title, 120),
      description: text(p.description, 800),
      image:
        typeof p.image === 'string' && /^\/api\/upload\?key=[a-f0-9-]{36}$/.test(p.image)
          ? p.image
          : '',
      images: Array.isArray(p.images)
        ? p.images.filter((v: unknown) => !!recordedVideoUrl(v)).slice(0, 10)
        : [],
      recordedVideo: recordedVideoUrl(p.recordedVideo),
      video: youtubeOfferURL(p.video) ? p.video : '',
      regularPrice: text(p.regularPrice, 30).replace(',', '.'),
      promoPrice: text(p.promoPrice, 30).replace(',', '.'),
      startDate: text(p.startDate, 10),
      endDate: text(p.endDate, 10),
      enabled: p.enabled === true,
    }));
}
export function promotionStatus(p: Promotion, today = todayMorocco()) {
  if (!p.title.trim()) return 'draft';
  if (!p.enabled) return 'inactive';
  if (
    (p.startDate && !dateValid(p.startDate)) ||
    (p.endDate && !dateValid(p.endDate)) ||
    (p.startDate && p.endDate && p.startDate > p.endDate)
  )
    return 'draft';
  if (p.startDate && p.startDate > today) return 'scheduled';
  if (p.endDate && p.endDate < today) return 'expired';
  return 'active';
}
export function activePromotions(value: unknown, today = todayMorocco()) {
  return normalizePromotions(value).filter((p) => promotionStatus(p, today) === 'active');
}
export function promotionPrice(value: string) {
  if (!value || !priceValid(value)) return '';
  return (
    new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
      Number(value.replace(',', '.')),
    ) + ' DH'
  );
}

// Explicitly move legacy standalone media; leave unrelated content and offer settings intact.
export function associateLegacyMedia(
  data: any,
  id: string,
  kind: 'photo' | 'video' | 'recordedVideo',
  value: string,
) {
  const target = data.promotions?.find((p: any) => p.id === id);
  if (!target || !value) return null;
  if (kind === 'photo') {
    if (!data.photos?.includes(value)) return null;
    const existing = [target.image, ...(target.images || [])].filter(Boolean);
    if (!existing.includes(value) && target.image && (target.images || []).length >= 10)
      return null;
    return {
      ...data,
      photos: data.photos.filter((src: string) => src !== value),
      promotions: data.promotions.map((p: any) =>
        p.id !== id || existing.includes(value)
          ? p
          : !p.image
            ? { ...p, image: value }
            : { ...p, images: [...(p.images || []), value] },
      ),
    };
  }
  if (data[kind] !== value || (target[kind] && target[kind] !== value)) return null;
  return {
    ...data,
    [kind]: '',
    promotions: data.promotions.map((p: any) => (p.id === id ? { ...p, [kind]: value } : p)),
  };
}

export function youtubeOfferURL(value: unknown) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'youtu.be'
        ? /^[\w-]{11}$/.test(url.pathname.slice(1))
        : ['youtube.com', 'www.youtube.com'].includes(url.hostname) &&
          /^[\w-]{11}$/.test(url.searchParams.get('v') || ''))
    );
  } catch {
    return false;
  }
}
