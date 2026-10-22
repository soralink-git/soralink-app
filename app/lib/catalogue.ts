export const MAX_CATALOGUE_ITEMS = 40;
export const PAID_CATALOGUE_ITEMS = 40;
export const HARD_CATALOGUE_ITEMS = 200;
export const TRIAL_CATALOGUE_ITEMS = 40;
export function catalogueLimit(profile: { state?: string } | null | undefined) {
  return profile && ['active', 'suspended'].includes(profile.state || '')
    ? PAID_CATALOGUE_ITEMS
    : TRIAL_CATALOGUE_ITEMS;
}
export type CatalogueItem = {
  id: string;
  type: 'product' | 'service';
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
  thumbnail: string;
  nameFr: string;
  nameAr: string;
  descriptionAr: string;
  categoryAr: string;
  categoryId: string;
  images: string[];
  oldPrice: string;
  reference: string;
  availability: 'available' | 'soldout' | 'hidden';
  promotion: boolean;
  promoStart: string;
  promoEnd: string;
};
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const demoImage = (value: unknown) => value === '/soralink-pack-hero.webp';
const imageValid = (value: unknown) =>
  typeof value === 'string' && /^\/api\/upload\?key=[a-f0-9-]{36}$/.test(value);
export const priceValid = (value: string) => !value || /^\d{1,9}([.,]\d{1,2})?$/.test(value);
// A completely empty draft is optional; partially filled articles still require a name.
const emptyDraft = (item: any) =>
  item &&
  typeof item === 'object' &&
  [
    'name',
    'nameFr',
    'nameAr',
    'description',
    'descriptionAr',
    'category',
    'categoryAr',
    'categoryId',
    'price',
    'oldPrice',
    'image',
    'thumbnail',
    'reference',
  ].every(
    (key) =>
      item[key] === undefined ||
      item[key] === null ||
      (typeof item[key] === 'string' && !item[key].trim()),
  ) &&
  (!Array.isArray(item.images) || item.images.length === 0) &&
  !item.promotion;
const legacyItem = (item: unknown) => (typeof item === 'string' ? { name: item } : item);
export function catalogueError(value: unknown, limit = MAX_CATALOGUE_ITEMS) {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length > limit)
    return `Le catalogue peut contenir jusqu’à ${limit} produits ou services.`;
  const ids = new Set<string>();
  for (const [i, raw] of value.entries()) {
    const item: any = legacyItem(raw);
    if (emptyDraft(item)) continue;
    if (
      !item ||
      typeof item !== 'object' ||
      !(item.nameFr || item.name || item.nameAr)?.trim() ||
      [item.name, item.nameFr, item.nameAr].some(
        (v) => v != null && (typeof v !== 'string' || v.length > 120),
      )
    )
      return 'Renseignez un nom pour chaque produit ou service (120 caractères maximum).';
    if (typeof item.description === 'string' && item.description.length > 800)
      return 'La description d’un article ne doit pas dépasser 800 caractères.';
    if (typeof item.category === 'string' && item.category.length > 80)
      return 'Une catégorie ne doit pas dépasser 80 caractères.';
    if (!priceValid(text(item.price, 30)))
      return 'Renseignez un prix positif avec deux décimales maximum, ou laissez le prix vide.';
    if (
      [item.descriptionAr].some((v) => v != null && (typeof v !== 'string' || v.length > 800)) ||
      [item.categoryAr, item.categoryId, item.reference].some(
        (v) => v != null && (typeof v !== 'string' || v.length > 80),
      )
    )
      return 'Vérifiez les textes de cet article.';
    if (
      item.availability !== undefined &&
      !['available', 'soldout', 'hidden'].includes(item.availability)
    )
      return 'Disponibilité invalide.';
    if (
      item.images !== undefined &&
      (!Array.isArray(item.images) ||
        item.images.length > 5 ||
        item.images.some((v: unknown) => !imageValid(v)))
    )
      return 'Ajoutez jusqu’à cinq photos supplémentaires par article.';
    if (!priceValid(text(item.oldPrice, 30))) return 'Ancien prix invalide.';
    if (item.promotion !== undefined && typeof item.promotion !== 'boolean')
      return 'Promotion invalide.';
    for (const key of ['promoStart', 'promoEnd'])
      if (
        item[key] &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(item[key]) ||
          !Number.isFinite(Date.parse(item[key] + 'T12:00:00Z')) ||
          new Date(item[key] + 'T12:00:00Z').toISOString().slice(0, 10) !== item[key])
      )
        return 'Date de promotion invalide.';
    if (item.promoStart && item.promoEnd && item.promoEnd < item.promoStart)
      return 'La promotion doit se terminer après son début.';
    if (item.thumbnail && !imageValid(item.thumbnail)) return 'Miniature invalide.';
    if (item.image && !imageValid(item.image))
      return 'Ajoutez les photos du catalogue avec le bouton prévu.';
    const id = text(item.id, 80) || 'legacy-' + i;
    if (ids.has(id))
      return 'Deux articles du catalogue ont le même identifiant. Supprimez puis recréez l’article en double.';
    ids.add(id);
  }
  return null;
}
export function normalizeCatalogue(
  value: unknown,
  includeDrafts = false,
  demo = false,
): CatalogueItem[] {
  if (!Array.isArray(value)) return [];
  // Keep spaces and incomplete decimal input in the editor; normalize only for publication.
  const fieldText = (v: unknown, max: number) =>
    includeDrafts ? (typeof v === 'string' ? v.slice(0, max) : '') : text(v, max);
  return value
    .slice(0, HARD_CATALOGUE_ITEMS)
    .map(legacyItem)
    .map((item: any, i) => ({ item, i }))
    .filter(({ item }) => item && typeof item === 'object' && (includeDrafts || !emptyDraft(item)))
    .map(({ item, i }) => ({
      id: fieldText(item.id, 80) || 'legacy-' + i,
      type: item.type === 'product' ? 'product' : 'service',
      name: fieldText(item.nameFr ?? item.name, 120) || fieldText(item.nameAr, 120),
      nameFr: fieldText(item.nameFr ?? item.name, 120),
      nameAr: fieldText(item.nameAr, 120),
      descriptionAr: fieldText(item.descriptionAr, 800),
      categoryAr: fieldText(item.categoryAr, 80),
      categoryId: fieldText(item.categoryId, 80),
      images: Array.isArray(item.images) ? item.images.filter(imageValid).slice(0, 5) : [],
      oldPrice: includeDrafts
        ? fieldText(item.oldPrice, 30)
        : priceValid(fieldText(item.oldPrice, 30))
          ? fieldText(item.oldPrice, 30).replace(',', '.').trim()
          : '',
      reference: fieldText(item.reference, 80),
      availability: ['soldout', 'hidden'].includes(item.availability)
        ? item.availability
        : 'available',
      promotion: item.promotion === true,
      promoStart: fieldText(item.promoStart, 10),
      promoEnd: fieldText(item.promoEnd, 10),
      description: fieldText(item.description, 800),
      category: fieldText(item.category, 80),
      price: includeDrafts
        ? fieldText(item.price, 30)
        : priceValid(fieldText(item.price, 30))
          ? fieldText(item.price, 30).replace(',', '.')
          : '',
      image: imageValid(item.image) || (demo && demoImage(item.image)) ? item.image : '',
      thumbnail: imageValid(item.thumbnail) ? item.thumbnail : '',
    }));
}
export function cataloguePrice(value: string, ar = false) {
  if (!value || !priceValid(value)) return '';
  return (
    new Intl.NumberFormat(ar ? 'ar-MA' : 'fr-MA', { maximumFractionDigits: 2 }).format(
      Number(value.replace(',', '.')),
    ) + (ar ? ' د.م.' : ' DH')
  );
}
export function catalogueSelection(value: unknown, id: unknown) {
  return typeof id === 'string'
    ? normalizeCatalogue(value).find(
        (item) => item.id === id && item.name && item.availability === 'available',
      )
    : undefined;
}
export function catalogueRequestMessage(item: CatalogueItem, message: string, ar = false) {
  return [
    (ar
      ? item.type === 'product'
        ? 'المنتج المطلوب: '
        : 'الخدمة المطلوبة: '
      : item.type === 'product'
        ? 'Produit demandé : '
        : 'Service demandé : ') + item.name,
    item.reference ? (ar ? 'المرجع: ' : 'Référence : ') + item.reference : '',
    item.category ? (ar ? 'الفئة: ' : 'Catégorie : ') + item.category : '',
    item.price
      ? (ar ? 'الثمن المعروض: ' : 'Prix affiché lors de la demande : ') +
        cataloguePrice(item.price, ar)
      : '',
    message.trim(),
  ]
    .filter(Boolean)
    .join('\n');
}
