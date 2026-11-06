import { capabilities } from './offers';
import { normalizePromotions } from './promotions';
import { normalizeCatalogue, catalogueLimit } from './catalogue';

// Runtime helpers used by both the server and the browser. The matching zod
// schemas live in catalog-schemas.ts so the public bundle does not ship zod.
export type CatalogRights = {
  enabled: boolean;
  pdf: boolean;
  products: boolean;
  whatsapp: boolean;
  downloads: boolean;
  maxDocuments: number;
  maxProducts: number;
  storageMB: number;
  maxFiles: number;
  pdfMB: number;
  pdfPages: number;
};
export type CatalogDocument = {
  id: string;
  src: string;
  titleFr: string;
  titleAr: string;
  descriptionFr: string;
  descriptionAr: string;
  cover: string;
  visible: boolean;
  allowDownload: boolean;
};
export type CatalogSettings = {
  enabled: boolean;
  pdf: boolean;
  products: boolean;
  whatsapp: boolean;
  showPrices: boolean;
  fulfillmentModes: ('onsite' | 'takeaway' | 'delivery')[];
  layout: 'grid' | 'list';
  accent: string;
};
export type CatalogCategory = { id: string; nameFr: string; nameAr: string; visible: boolean };

const ASSET_RE =
  /^(?:|\/api\/upload\?key=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
const DOC_ID_RE = /^(?:legacy-pdf|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
const DEMO_DOCUMENTS = [
  '/demo/soralink/catalogue-fr.pdf',
  '/demo/soralink/catalogue-ar.pdf',
  '/demo/soralink/catalogue-v2-fr.pdf',
  '/demo/soralink/catalogue-v2-ar.pdf',
];
const DEMO_COVERS = ['/soralink-pack-hero.webp', '/demo/soralink/premium/nfc.webp'];
const SETTINGS_DEFAULT: CatalogSettings = {
  enabled: true,
  pdf: true,
  products: true,
  whatsapp: true,
  showPrices: true,
  fulfillmentModes: [],
  layout: 'grid',
  accent: '',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number) =>
  typeof value === 'string' && value.length <= max ? value : undefined;
const flag = (value: unknown) => (typeof value === 'boolean' ? value : undefined);
const integer = (value: unknown, min: number, max: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
    ? value
    : undefined;

export function catalogRights(profile?: any): CatalogRights {
  const defaults: CatalogRights = {
    enabled: true,
    pdf: true,
    products: true,
    whatsapp: true,
    downloads: true,
    maxDocuments: 3,
    maxProducts: catalogueLimit(profile),
    storageMB: 400,
    maxFiles: 160,
    pdfMB: 25,
    pdfPages: 100,
  };
  const raw = profile?.catalog_rights ?? profile?.catalogRights;
  const allowed = capabilities(profile).catalogue;
  if (raw == null && allowed) return defaults;
  const denied: CatalogRights = {
    ...defaults,
    enabled: false,
    pdf: false,
    products: false,
    whatsapp: false,
    downloads: false,
    maxDocuments: 0,
    maxProducts: 0,
  };
  if (!allowed) return denied;
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return denied;
    }
  }
  if (!isRecord(value)) return denied;
  const booleans = ['enabled', 'pdf', 'products', 'whatsapp', 'downloads'] as const;
  const ranges = {
    maxDocuments: [0, 10],
    maxProducts: [0, 200],
    storageMB: [1, 2000],
    maxFiles: [1, 500],
    pdfMB: [1, 25],
    pdfPages: [1, 100],
  } as const;
  const parsed: Record<string, boolean | number> = {};
  for (const key of booleans) {
    if (typeof value[key] !== 'boolean') return denied;
    parsed[key] = value[key];
  }
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const candidate = value[key];
    if (
      typeof candidate !== 'number' ||
      !Number.isInteger(candidate) ||
      candidate < min ||
      candidate > max
    )
      return denied;
    parsed[key] = candidate;
  }
  return parsed as CatalogRights;
}

function documentFrom(value: unknown, demo = false): CatalogDocument | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !DOC_ID_RE.test(value.id)) return null;
  if (typeof value.src !== 'string') return null;
  if (demo) {
    if (!DEMO_DOCUMENTS.includes(value.src)) return null;
    if (typeof value.cover !== 'string' || !DEMO_COVERS.includes(value.cover)) return null;
  } else if (!ASSET_RE.test(value.src)) {
    return null;
  }
  const titleFr = text(value.titleFr ?? '', 120);
  const titleAr = text(value.titleAr ?? '', 120);
  const descriptionFr = text(value.descriptionFr ?? '', 800);
  const descriptionAr = text(value.descriptionAr ?? '', 800);
  const cover = text(value.cover ?? '', 400);
  const visible = flag(value.visible ?? true);
  const allowDownload = flag(value.allowDownload ?? false);
  if (
    titleFr === undefined ||
    titleAr === undefined ||
    descriptionFr === undefined ||
    descriptionAr === undefined ||
    cover === undefined ||
    (!demo && !ASSET_RE.test(cover)) ||
    visible === undefined ||
    allowDownload === undefined
  )
    return null;
  return {
    id: value.id,
    src: value.src,
    titleFr,
    titleAr,
    descriptionFr,
    descriptionAr,
    cover,
    visible,
    allowDownload,
  };
}

export function catalogDocuments(data: any, demo = false): CatalogDocument[] {
  if (Array.isArray(data?.catalogDocuments))
    return data.catalogDocuments
      .flatMap((value: unknown) => {
        const document = documentFrom(value) || (demo ? documentFrom(value, true) : null);
        return document ? [document] : [];
      })
      .slice(0, 10);
  const legacy =
    typeof data?.pdf === 'string' && data.pdf.length > 0 && ASSET_RE.test(data.pdf) ? data.pdf : '';
  return legacy
    ? [
        {
          id: 'legacy-pdf',
          src: legacy,
          titleFr: '',
          titleAr: '',
          descriptionFr: '',
          descriptionAr: '',
          cover: '',
          visible: true,
          allowDownload: false,
        },
      ]
    : [];
}

function settingsFrom(value: unknown): CatalogSettings | null {
  if (value === undefined) return { ...SETTINGS_DEFAULT };
  if (!isRecord(value)) return null;
  const settings: CatalogSettings = { ...SETTINGS_DEFAULT };
  for (const key of ['enabled', 'pdf', 'products', 'whatsapp', 'showPrices'] as const) {
    if (key in value) {
      const parsed = flag(value[key]);
      if (parsed === undefined) return null;
      settings[key] = parsed;
    }
  }
  if ('fulfillmentModes' in value) {
    const modes = value.fulfillmentModes;
    if (
      !Array.isArray(modes) ||
      modes.length > 3 ||
      modes.some((mode) => !['onsite', 'takeaway', 'delivery'].includes(mode as string)) ||
      new Set(modes).size !== modes.length
    )
      return null;
    settings.fulfillmentModes = modes as CatalogSettings['fulfillmentModes'];
  }
  if ('layout' in value) {
    if (!['grid', 'list'].includes(value.layout as string)) return null;
    settings.layout = value.layout as CatalogSettings['layout'];
  }
  if ('accent' in value) {
    const accent = value.accent;
    if (!(accent === '' || (typeof accent === 'string' && /^#[0-9a-f]{6}$/i.test(accent))))
      return null;
    settings.accent = accent as string;
  }
  return settings;
}

export function catalogSettings(data: any): CatalogSettings {
  return settingsFrom(data?.catalogSettings) ?? { ...SETTINGS_DEFAULT };
}

function categoryFrom(value: unknown): CatalogCategory | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.length || value.id.length > 80)
    return null;
  const nameFr = text(value.nameFr ?? '', 120);
  const nameAr = text(value.nameAr ?? '', 120);
  const visible = flag(value.visible ?? true);
  if (nameFr === undefined || nameAr === undefined || visible === undefined) return null;
  return { id: value.id, nameFr, nameAr, visible };
}

export function catalogCategories(data: any): CatalogCategory[] {
  const value = data?.catalogCategories;
  if (!Array.isArray(value) || value.length > 40) return [];
  const categories: CatalogCategory[] = [];
  for (const entry of value) {
    const category = categoryFrom(entry);
    if (!category) return [];
    categories.push(category);
  }
  return categories;
}

export function catalogEnabled(
  data: any,
  rights: CatalogRights,
  kind: 'pdf' | 'products' | 'whatsapp',
) {
  const s = catalogSettings(data);
  return rights.enabled && rights[kind] && s.enabled && s[kind];
}

export function catalogContentIssue(data: any, previous: any, rights: CatalogRights) {
  const docs = catalogDocuments(data),
    items = normalizeCatalogue(data.services);
  if (
    docs.length > Math.max(rights.maxDocuments, catalogDocuments(previous).length) ||
    items.length > Math.max(rights.maxProducts, normalizeCatalogue(previous.services).length)
  )
    return 'Le catalogue dépasse les limites de votre offre.';
  if (new Set(docs.map((d) => d.id)).size !== docs.length)
    return 'Chaque document doit avoir un identifiant différent.';
  const cats = catalogCategories(data);
  if (new Set(cats.map((c) => c.id)).size !== cats.length)
    return 'Chaque catégorie doit avoir un identifiant différent.';
  if (items.some((i: any) => i.categoryId && !cats.some((c) => c.id === i.categoryId)))
    return 'Choisissez une catégorie existante.';
  if (
    !rights.enabled &&
    JSON.stringify([docs, items, catalogCategories(data), catalogSettings(data)]) !==
      JSON.stringify([
        catalogDocuments(previous),
        normalizeCatalogue(previous.services),
        catalogCategories(previous),
        catalogSettings(previous),
      ])
  )
    return 'Le module Produits et services est désactivé pour votre compte.';
  if (!rights.pdf && JSON.stringify(docs) !== JSON.stringify(catalogDocuments(previous)))
    return 'La gestion PDF est désactivée pour votre compte.';
  if (
    !rights.products &&
    JSON.stringify([items, catalogCategories(data)]) !==
      JSON.stringify([normalizeCatalogue(previous.services), catalogCategories(previous)])
  )
    return 'Le catalogue interactif est désactivé pour votre compte.';
  const media = (d: any) => [
    Array.isArray(d.photos) ? d.photos : [],
    d.video || '',
    d.recordedVideo || '',
    normalizePromotions(d.promotions),
  ];
  if (!rights.enabled && JSON.stringify(media(data)) !== JSON.stringify(media(previous)))
    return 'Les médias du catalogue sont désactivés pour votre compte.';
  const old = catalogSettings(previous),
    next = catalogSettings(data);
  if (!rights.whatsapp && next.whatsapp !== old.whatsapp && next.whatsapp)
    return 'Les commandes WhatsApp sont désactivées pour votre compte.';
  return '';
}

export function catalogText(
  fr: string | undefined,
  ar: string | undefined,
  arabic: boolean,
  optional = false,
) {
  const chosen = (arabic ? ar : fr)?.trim();
  if (chosen) return chosen;
  if (optional && !fr && !ar) return '';
  return arabic ? 'المحتوى غير متوفر بالعربية' : 'Contenu indisponible en français';
}

export function visibleProducts(data: any) {
  const cats = catalogCategories(data);
  return (data.services || []).filter(
    (p: any) =>
      p.availability !== 'hidden' &&
      (!p.categoryId || cats.some((c) => c.id === p.categoryId && c.visible)),
  );
}

export function documentContentPath(profile: string, document: string) {
  return (
    '/api/catalog-documents/' + encodeURIComponent(profile) + '/' + encodeURIComponent(document)
  );
}
