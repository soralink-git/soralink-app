import { z } from 'zod';

// Server-only validation; catalogue.ts keeps the runtime helpers free of zod.
export const catalogueVariantSchema = z
  .object({
    id: z.string().min(1).max(80),
    nameFr: z.string().trim().max(80).default(''),
    nameAr: z.string().trim().max(80).default(''),
    price: z
      .string()
      .max(30)
      .default('')
      .refine((v) => !v || /^\d{1,9}([.,]\d{1,2})?$/.test(v)),
    availability: z.enum(['available', 'soldout']).default('available'),
  })
  .strict()
  .refine((v) => !!(v.nameFr || v.nameAr), 'Nommez chaque variante.');
export const catalogueVariantsSchema = z
  .array(catalogueVariantSchema)
  .max(12)
  .refine(
    (v) => new Set(v.map((i) => i.id)).size === v.length,
    'Identifiants de variantes dupliqués.',
  );
