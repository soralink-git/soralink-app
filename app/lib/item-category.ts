import { catalogCategories } from './catalog-menu';
import { normalizeCatalogue } from './catalogue';

export function assignItemCategory(data: any, itemId: string, categoryId: string) {
  const items = normalizeCatalogue(data.services, true);
  if (!items.some((p) => p.id === itemId)) return data;
  if (categoryId && !catalogCategories(data).some((c) => c.id === categoryId)) return data;
  return {
    ...data,
    services: items.map((p) =>
      p.id === itemId ? { ...p, categoryId, category: '', categoryAr: '' } : p,
    ),
  };
}

export function saveItemCategory(
  data: any,
  itemId: string,
  language: 'Fr' | 'Ar',
  value: string,
  categoryId = '',
  newId = '',
) {
  const name = value.trim();
  if (!name || name.length > 120) return data;
  if (!normalizeCatalogue(data.services, true).some((p) => p.id === itemId)) return data;
  const cats = catalogCategories(data);
  const field = language === 'Ar' ? 'nameAr' : 'nameFr';
  const selected = cats.find((c) => c.id === categoryId);
  if (categoryId && !selected) return data;
  if (selected) {
    return assignItemCategory(
      {
        ...data,
        catalogCategories: cats.map((c) => (c.id === selected.id ? { ...c, [field]: name } : c)),
      },
      itemId,
      selected.id,
    );
  }
  const existing = cats.find((c) => c[field].trim().toLowerCase() === name.toLowerCase());
  if (existing) return assignItemCategory(data, itemId, existing.id);
  if (cats.length >= 40) return data;
  const id = newId || crypto.randomUUID();
  if (id.length > 80 || cats.some((c) => c.id === id)) return data;
  return assignItemCategory(
    {
      ...data,
      catalogCategories: [...cats, { id, nameFr: '', nameAr: '', visible: true, [field]: name }],
    },
    itemId,
    id,
  );
}

export function removeItemCategory(data: any, categoryId: string) {
  const cats = catalogCategories(data);
  if (!cats.some((c) => c.id === categoryId)) return data;
  return {
    ...data,
    catalogCategories: cats.filter((c) => c.id !== categoryId),
    services: normalizeCatalogue(data.services, true).map((p) =>
      p.categoryId === categoryId ? { ...p, categoryId: '', category: '', categoryAr: '' } : p,
    ),
  };
}
