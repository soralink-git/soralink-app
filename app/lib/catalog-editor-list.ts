import type { CatalogueItem } from './catalogue';

const searchable = (value: string) =>
  value.normalize('NFD').replace(/\p{M}/gu, '').replace(/ـ/g, '').toLowerCase().trim();

// Keep original order and object identities: filtering must not affect manual
// reordering, quotas, saved data or the article currently being edited.
export function catalogEditorItems(
  items: CatalogueItem[],
  {
    query,
    categoryId,
    ar,
    editingId = '',
  }: {
    query: string;
    categoryId: string;
    ar: boolean;
    editingId?: string;
  },
) {
  const term = searchable(query);
  return items.filter(
    (item) =>
      item.id === editingId ||
      ((!categoryId || item.categoryId === categoryId) &&
        (!term ||
          searchable(`${ar ? item.nameAr : item.nameFr} ${item.reference}`).includes(term))),
  );
}
