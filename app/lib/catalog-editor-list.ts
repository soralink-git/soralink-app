import type { CatalogueItem } from './catalogue';

import { matchesCatalogSearch } from './catalog-search';

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
  return items.filter(
    (item) =>
      item.id === editingId ||
      ((!categoryId || item.categoryId === categoryId) && matchesCatalogSearch(item, query, ar)),
  );
}
