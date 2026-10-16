import { z } from 'zod';
import { normalizeCatalogue, cataloguePrice } from './catalogue';
import { catalogText } from './catalog-menu';
export const catalogOrderSchema = z
  .object({
    profile: z.string().min(1).max(128),
    language: z.enum(['fr', 'ar']),
    items: z
      .array(z.object({ id: z.string().min(1).max(80), quantity: z.number().int().min(1).max(99) }))
      .min(1)
      .max(40),
  })
  .refine((v) => new Set(v.items.map((i) => i.id)).size === v.items.length, 'Sélection invalide.');
export function catalogOrderMessage(
  data: any,
  selection: { id: string; quantity: number }[],
  ar: boolean,
) {
  const products = normalizeCatalogue(data.services),
    t = (fr: string, a: string) => (ar ? a : fr);
  const lines = selection.map(({ id, quantity }) => {
    const p = products.find((p) => p.id === id && p.availability === 'available');
    if (!p) throw Error('Unavailable');
    return `${quantity} × ${catalogText(p.nameFr, p.nameAr, ar)}${p.reference ? ' · ' + t('Réf. ', 'المرجع ') + p.reference : ''}${p.price ? ' · ' + cataloguePrice(p.price, ar) : ''}`;
  });
  return [
    t(
      'Bonjour, je souhaite commander ou demander un devis pour :',
      'السلام عليكم، بغيت نطلب أو نسول على ثمن:',
    ),
    ...lines,
    t(
      'Prix indicatifs, disponibilité et total à confirmer.',
      'الأثمنة تقريبية. المرجو تأكيد التوفر والمجموع.',
    ),
  ].join('\n');
}
