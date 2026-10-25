import { z } from 'zod';
import { normalizeCatalogue, cataloguePrice, type CatalogueItem } from './catalogue';
import { catalogText, catalogSettings } from './catalog-menu';
export const fulfillmentLabels = {
  onsite: ['Sur place', 'فالمحل'],
  takeaway: ['À emporter', 'ناخدو معايا'],
  delivery: ['Livraison', 'التوصيل'],
} as const;
export const MAX_CATALOG_SELECTIONS = 40;
export function canAddSelection(keys: readonly string[], key: string) {
  return keys.includes(key) || keys.length < MAX_CATALOG_SELECTIONS;
}
export type Selection = { id: string; quantity: number; variantId?: string };
export const selectionKey = (id: string, variantId = '') => JSON.stringify([id, variantId]);
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
export function selectedProduct(p: CatalogueItem, variantId?: string) {
  if (p.availability !== 'available') throw Error('Unavailable');
  if (!p.variants.length) {
    if (variantId) throw Error('Unavailable');
    return p;
  }
  const variant = p.variants.find((v) => v.id === variantId && v.availability === 'available');
  if (!variant) throw Error('Unavailable');
  return { ...p, price: variant.price || p.price, selectedVariant: variant };
}
export function resolveSelection(data: any, selection: Selection[]) {
  const products = normalizeCatalogue(data.services);
  return selection.map((line) => {
    const p = products.find((p) => p.id === line.id);
    if (!p) throw Error('Unavailable');
    return { ...line, product: selectedProduct(p, line.variantId) };
  });
}
export function selectionTotal(rows: { product: { price: string }; quantity: number }[]) {
  if (!rows.length || rows.some((row) => !row.product.price)) return null;
  return (
    rows.reduce(
      (total, row) =>
        total + Math.round(Number(row.product.price.replace(',', '.')) * 100) * row.quantity,
      0,
    ) / 100
  );
}
export function catalogOrderMessage(
  data: any,
  selection: Selection[],
  ar: boolean,
  options: { fulfillment?: string; address?: string; name?: string; phone?: string } = {},
) {
  const rows = resolveSelection(data, selection),
    t = (fr: string, a: string) => (ar ? a : fr);
  const modes = catalogSettings(data).fulfillmentModes;
  if (
    (modes.length && !modes.includes(options.fulfillment as any)) ||
    (!modes.length && options.fulfillment)
  )
    throw Error('Fulfillment');
  if (options.fulfillment === 'delivery' && !options.address?.trim()) throw Error('Address');
  const lines = rows.map(({ product: p, quantity, variantId }) => {
    const variant = variantId ? p.variants.find((v) => v.id === variantId) : null;
    return `${quantity} × ${catalogText(p.nameFr, p.nameAr, ar)}${variant ? ' · ' + catalogText(variant.nameFr, variant.nameAr, ar) : ''}${p.reference ? ' · ' + t('Réf. ', 'المرجع ') + p.reference : ''}${p.price ? ' · ' + cataloguePrice(p.price, ar) : ''}`;
  });
  return [
    t(
      'Bonjour, je souhaite commander ou demander un devis pour :',
      'السلام عليكم، بغيت نطلب أو نسول على ثمن:',
    ),
    ...lines,
    options.fulfillment
      ? t('Mode : ', 'الطريقة: ') +
        fulfillmentLabels[options.fulfillment as keyof typeof fulfillmentLabels][ar ? 1 : 0]
      : '',
    options.fulfillment === 'delivery' ? t('Adresse : ', 'العنوان: ') + options.address : '',
    options.name ? t('Nom : ', 'الاسم: ') + options.name : '',
    options.phone ? t('Téléphone : ', 'التلفون: ') + options.phone : '',
    t(
      'Prix indicatifs, disponibilité et total à confirmer.',
      'الأثمنة تقريبية. المرجو تأكيد التوفر والمجموع.',
    ),
  ]
    .filter(Boolean)
    .join('\n');
}
