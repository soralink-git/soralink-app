import { z } from 'zod';
import { MAX_CATALOG_SELECTIONS, selectionKey } from './catalog-order';

// Server-only order schema; catalog-order.ts keeps the helpers free of zod.
export const catalogOrderSchema = z
  .object({
    profile: z.string().min(1).max(128),
    language: z.enum(['fr', 'ar']),
    intentId: z.string().uuid().optional(),
    name: z.string().trim().max(120).default(''),
    phone: z
      .string()
      .trim()
      .max(40)
      .regex(/^[+\d\s().-]*$/)
      .default(''),
    fulfillment: z.enum(['', 'onsite', 'takeaway', 'delivery']).default(''),
    address: z.string().trim().max(300).default(''),
    items: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          quantity: z.number().int().min(1).max(99),
          variantId: z.string().min(1).max(80).optional(),
        }),
      )
      .min(1)
      .max(MAX_CATALOG_SELECTIONS),
  })
  .refine(
    (v) => new Set(v.items.map((i) => selectionKey(i.id, i.variantId))).size === v.items.length,
    'Sélection invalide.',
  );
