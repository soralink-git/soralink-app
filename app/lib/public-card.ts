import { visibleProfileLinks, profileLinkKinds } from './profile-links';
import {
  catalogDocuments,
  catalogCategories,
  catalogSettings,
  catalogEnabled,
  catalogRights,
  visibleProducts,
  type CatalogRights,
} from './catalog-menu';
import { normalizeAppearance } from './personalization';
import { normalizeCatalogue } from './catalogue';
import { activePromotions } from './promotions';
import { normalizeSchedule } from './schedule';
const textFields = [
  'name',
  'job',
  'business',
  'bio',
  'phone',
  'email',
  'address',
  'whatsapp',
  'website',
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'youtube',
  'x',
  'mapsUrl',
  'mapDestination',
  'googleReview',
  'color',
  'template',
  'avatar',
  'cover',
  'backgroundPhoto',
  'pdf',
  'video',
];
const socialFields = ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'x'];
// Explicit public projection: saved account data is never returned wholesale.
export function publicCardData(
  saved: any,
  pro: boolean,
  rights: CatalogRights = catalogRights({ state: 'active' }),
) {
  const d = normalizeAppearance(saved),
    out: Record<string, any> = {};
  for (const key of textFields) out[key] = typeof d[key] === 'string' ? d[key] : '';
  for (const key of [
    'fondColor',
    'backgroundOpacity',
    'blockColor',
    'textColor',
    'buttonColor',
    'textSize',
    'buttonSize',
    'buttonStyle',
    'cardTheme',
    'cardFont',
    'buttonShape',
    'avatarShape',
    'sectionOrder',
    'socialOrder',
    'hiddenSections',
    'sectionTitles',
    'hidePhone',
    'hideEmail',
    'hideLocation',
    'hideSocial',
    'hideWhatsApp',
  ])
    out[key] = d[key];
  out.pro = pro;
  out.defaultLanguage = d.defaultLanguage === 'ar' || d.lang === 'ar' ? 'ar' : 'fr';
  out.services = normalizeCatalogue(d.services).filter((item) => item.name);
  out.catalogSettings = {
    ...catalogSettings(d),
    enabled: rights.enabled && catalogSettings(d).enabled,
    pdf: catalogEnabled(d, rights, 'pdf'),
    products: catalogEnabled(d, rights, 'products'),
    whatsapp: catalogEnabled(d, rights, 'whatsapp'),
  };
  out.catalogDocuments = catalogEnabled(d, rights, 'pdf')
    ? catalogDocuments(d)
        .filter((doc) => doc.visible)
        .slice(0, rights.maxDocuments)
        .map((doc) => ({ ...doc, allowDownload: doc.allowDownload && rights.downloads }))
    : [];
  out.pdf = '';
  out.catalogCategories = catalogCategories(d).filter((c) => c.visible);
  out.services = catalogEnabled(d, rights, 'products')
    ? visibleProducts({ ...d, services: out.services }).slice(0, rights.maxProducts)
    : [];
  if (!out.catalogSettings.showPrices)
    out.services = out.services.map((p: any) => ({ ...p, price: '', oldPrice: '' }));
  out.promotions = out.catalogSettings.enabled ? activePromotions(d.promotions) : [];
  // Standalone legacy files remain private until their owner attaches them to an offer.
  out.photos = [];
  out.video = '';
  out.recordedVideo = '';
  out.appointmentServices = pro ? normalizeSchedule(d).appointmentServices : [];
  if (d.hidePhone) out.phone = '';
  if (d.hideEmail) out.email = '';
  if (d.hideWhatsApp) out.whatsapp = '';
  if (d.hideLocation) for (const key of ['address', 'mapsUrl', 'mapDestination']) out[key] = '';
  if (d.hideSocial) for (const key of socialFields) out[key] = '';
  const hidden = new Set(d.hiddenSections);
  if (hidden.has('coordinates'))
    for (const key of ['phone', 'email', 'whatsapp', 'address', 'mapsUrl', 'mapDestination'])
      out[key] = '';
  if (hidden.has('social')) for (const key of socialFields) out[key] = '';
  if (hidden.has('promotions')) out.promotions = [];
  if (hidden.has('appointments')) {
    out.appointmentServices = [];
  }
  if (hidden.has('services')) {
    out.services = [];
    out.catalogCategories = [];
  }
  if (!out.catalogSettings.enabled || hidden.has('services')) {
    out.photos = [];
    out.video = '';
    out.recordedVideo = '';
  }
  if (hidden.has('photos')) out.photos = [];
  if (hidden.has('pdf')) {
    out.pdf = '';
    out.catalogDocuments = [];
  }
  if (hidden.has('video')) {
    out.video = '';
    out.recordedVideo = '';
  }
  if (hidden.has('links')) out.website = '';
  for (const lang of ['fr', 'ar'])
    for (const key of Object.keys(out.sectionTitles[lang]))
      if (hidden.has(key) || (key === 'appointments' && !pro)) delete out.sectionTitles[lang][key];
  if (Array.isArray(d.profileLinks)) {
    out.profileLinks = visibleProfileLinks(d);
    for (const kind of profileLinkKinds)
      out[kind] = out.profileLinks.find((entry: any) => entry.kind === kind)?.value || '';
    const address = out.profileLinks.find((entry: any) => entry.kind === 'address');
    out.mapsUrl = address?.mapsUrl || '';
    out.mapDestination = address?.mapDestination || '';
    out.hidePhone = false;
    out.hideEmail = false;
    out.hideWhatsApp = false;
    out.hideLocation = false;
  }
  return out;
}
