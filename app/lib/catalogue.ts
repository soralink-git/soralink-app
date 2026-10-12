export const MAX_CATALOGUE_ITEMS = 10;
export type CatalogueItem = {
  id: string;
  type: 'product' | 'service';
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
};
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const imageValid = (value: unknown) =>
  typeof value === 'string' && /^\/api\/upload\?key=[a-f0-9-]{36}$/.test(value);
const priceValid = (value: string) => !value || /^\d{1,9}([.,]\d{1,2})?$/.test(value);
// A completely empty draft is optional; partially filled articles still require a name.
const emptyDraft = (item: any) =>
  item &&
  typeof item === 'object' &&
  ['name', 'description', 'category', 'price', 'image'].every(
    (key) =>
      item[key] === undefined ||
      item[key] === null ||
      (typeof item[key] === 'string' && !item[key].trim()),
  );
const legacyItem = (item: unknown) => (typeof item === 'string' ? { name: item } : item);
export function catalogueError(value: unknown) {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.length > MAX_CATALOGUE_ITEMS)
    return 'Le catalogue peut contenir jusqu’à 10 produits ou services.';
  const ids = new Set<string>();
  for (const [i, raw] of value.entries()) {
    const item: any = legacyItem(raw);
    if (emptyDraft(item)) continue;
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      item.name.length > 120
    )
      return 'Renseignez un nom pour chaque produit ou service (120 caractères maximum).';
    if (typeof item.description === 'string' && item.description.length > 800)
      return 'La description d’un article ne doit pas dépasser 800 caractères.';
    if (typeof item.category === 'string' && item.category.length > 80)
      return 'Une catégorie ne doit pas dépasser 80 caractères.';
    if (!priceValid(text(item.price, 30)))
      return 'Renseignez un prix positif avec deux décimales maximum, ou laissez le prix vide.';
    if (item.image && !imageValid(item.image))
      return 'Ajoutez les photos du catalogue avec le bouton prévu.';
    const id = text(item.id, 80) || 'legacy-' + i;
    if (ids.has(id))
      return 'Deux articles du catalogue ont le même identifiant. Supprimez puis recréez l’article en double.';
    ids.add(id);
  }
  return null;
}
export function normalizeCatalogue(value: unknown): CatalogueItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_CATALOGUE_ITEMS)
    .map(legacyItem)
    .map((item: any, i) => ({ item, i }))
    .filter(({ item }) => item && typeof item === 'object' && !emptyDraft(item))
    .map(({ item, i }) => ({
      id: text(item.id, 80) || 'legacy-' + i,
      type: item.type === 'product' ? 'product' : 'service',
      name: text(item.name, 120),
      description: text(item.description, 800),
      category: text(item.category, 80),
      price: priceValid(text(item.price, 30)) ? text(item.price, 30).replace(',', '.') : '',
      image: imageValid(item.image) ? item.image : '',
    }));
}
export function cataloguePrice(value: string) {
  if (!value || !priceValid(value)) return '';
  return (
    new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(
      Number(value.replace(',', '.')),
    ) + ' DH'
  );
}
export function catalogueSelection(value: unknown, id: unknown) {
  return typeof id === 'string'
    ? normalizeCatalogue(value).find((item) => item.id === id && item.name)
    : undefined;
}
export function catalogueRequestMessage(item: CatalogueItem, message: string) {
  return [
    (item.type === 'product' ? 'Produit' : 'Service') + ' demandé : ' + item.name,
    item.category ? 'Catégorie : ' + item.category : '',
    item.price ? 'Prix affiché lors de la demande : ' + cataloguePrice(item.price) : '',
    message.trim(),
  ]
    .filter(Boolean)
    .join('\n');
}
