const searchable = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').replace(/ـ/g, '').toLowerCase().trim();
export function matchesCatalogSearch(
  item: { nameFr: string; nameAr: string; reference: string },
  query: string,
  ar: boolean,
) {
  const term = searchable(query);
  return !term || searchable(`${ar ? item.nameAr : item.nameFr} ${item.reference}`).includes(term);
}
