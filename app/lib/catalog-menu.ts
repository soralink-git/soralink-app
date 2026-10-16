import { z } from 'zod';
import { normalizeCatalogue } from './catalogue';
import { catalogueLimit } from './catalogue';
export const assetURL = z
  .string()
  .regex(/^(?:|\/api\/upload\?key=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/);
const label = z.string().max(120).default('');
const description = z.string().max(800).default('');
export const catalogRightsSchema = z.object({
  enabled: z.boolean(),
  pdf: z.boolean(),
  products: z.boolean(),
  whatsapp: z.boolean(),
  downloads: z.boolean(),
  maxDocuments: z.number().int().min(0).max(10),
  maxProducts: z.number().int().min(0).max(200),
  storageMB: z.number().int().min(1).max(2000),
  maxFiles: z.number().int().min(1).max(500),
  pdfMB: z.number().int().min(1).max(25),
  pdfPages: z.number().int().min(1).max(100),
});
export type CatalogRights = z.infer<typeof catalogRightsSchema>;
export function catalogRights(profile?: any): CatalogRights {
  const defaults = {
    enabled: true,
    pdf: true,
    products: true,
    whatsapp: true,
    downloads: true,
    maxDocuments: 3,
    maxProducts: catalogueLimit(profile),
    storageMB: 400,
    maxFiles: catalogueLimit(profile) > 10 ? 160 : 80,
    pdfMB: 25,
    pdfPages: 100,
  };
  const raw = profile?.catalog_rights ?? profile?.catalogRights;
  if (raw == null) return defaults;
  const denied = {
    ...defaults,
    enabled: false,
    pdf: false,
    products: false,
    whatsapp: false,
    downloads: false,
    maxDocuments: 0,
    maxProducts: 0,
  };
  try {
    const parsed = catalogRightsSchema.safeParse(typeof raw === 'string' ? JSON.parse(raw) : raw);
    return parsed.success ? parsed.data : denied;
  } catch {
    return denied;
  }
}
export const catalogDocumentSchema = z.object({
  id: z
    .string()
    .regex(/^(?:legacy-pdf|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/),
  src: assetURL,
  titleFr: label,
  titleAr: label,
  descriptionFr: description,
  descriptionAr: description,
  cover: assetURL.default(''),
  visible: z.boolean().default(true),
  allowDownload: z.boolean().default(false),
});
export type CatalogDocument = z.infer<typeof catalogDocumentSchema>;
export const catalogSettingsSchema = z
  .object({
    enabled: z.boolean().default(true),
    pdf: z.boolean().default(true),
    products: z.boolean().default(true),
    whatsapp: z.boolean().default(true),
    showPrices: z.boolean().default(true),
    layout: z.enum(['grid', 'list']).default('grid'),
    accent: z.union([z.literal(''), z.string().regex(/^#[0-9a-f]{6}$/i)]).default(''),
  })
  .default({});
export const catalogCategoriesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(80),
      nameFr: label,
      nameAr: label,
      visible: z.boolean().default(true),
    }),
  )
  .max(40);
export function catalogSettings(data: any) {
  const p = catalogSettingsSchema.safeParse(data?.catalogSettings);
  return p.success ? p.data : catalogSettingsSchema.parse({});
}
export function catalogDocuments(data: any): CatalogDocument[] {
  if (Array.isArray(data?.catalogDocuments))
    return data.catalogDocuments
      .flatMap((v: unknown) => {
        const p = catalogDocumentSchema.safeParse(v);
        return p.success ? [p.data] : [];
      })
      .slice(0, 10);
  return assetURL.safeParse(data?.pdf).success && data.pdf
    ? [
        {
          id: 'legacy-pdf',
          src: data.pdf,
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
export function catalogCategories(data: any) {
  const p = catalogCategoriesSchema.safeParse(data?.catalogCategories);
  return p.success ? p.data : [];
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
