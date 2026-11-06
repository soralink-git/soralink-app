import { z } from 'zod';

// Server-only schemas. The runtime helpers in catalog-menu.ts validate the same
// shapes without zod so the public card bundle stays small.
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
    fulfillmentModes: z
      .array(z.enum(['onsite', 'takeaway', 'delivery']))
      .max(3)
      .refine((v) => new Set(v).size === v.length)
      .default([]),
    layout: z.enum(['grid', 'list']).default('grid'),
    accent: z.union([z.literal(''), z.string().regex(/^#[0-9a-f]{6}$/i)]).default(''),
  })
  .default({
    enabled: true,
    pdf: true,
    products: true,
    whatsapp: true,
    showPrices: true,
    fulfillmentModes: [],
    layout: 'grid',
    accent: '',
  });
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
export const demoDocumentSchema = catalogDocumentSchema.extend({
  src: z.enum([
    '/demo/soralink/catalogue-fr.pdf',
    '/demo/soralink/catalogue-ar.pdf',
    '/demo/soralink/catalogue-v2-fr.pdf',
    '/demo/soralink/catalogue-v2-ar.pdf',
  ]),
  cover: z.enum(['/soralink-pack-hero.webp', '/demo/soralink/premium/nfc.webp']),
});
