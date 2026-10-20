'use client';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { catalogCategories, catalogText } from './lib/catalog-menu';
import { normalizeCatalogue } from './lib/catalogue';
import { assignItemCategory, saveItemCategory, removeItemCategory } from './lib/item-category';

type CategoryDraft = { id: string; name: string; visible: boolean };

export default function ItemCategoryField({
  data,
  setData,
  itemId,
  language,
  ar,
  disabled,
}: {
  data: any;
  setData: Dispatch<SetStateAction<any>>;
  itemId: string;
  language: 'Fr' | 'Ar';
  ar: boolean;
  disabled: boolean;
}) {
  const [editor, setEditor] = useState<CategoryDraft | null>(null);
  const t = (fr: string, arabic: string) => (ar ? arabic : fr);
  const cats = catalogCategories(data);
  const item = normalizeCatalogue(data.services, true).find((p) => p.id === itemId);
  const selected = cats.find((c) => c.id === item?.categoryId);
  const legacy = !item?.categoryId && !!(item?.category || item?.categoryAr);
  useEffect(() => setEditor(null), [itemId, language]);
  if (!item) return null;
  return (
    <div>
      <label className="field">
        {t('Catégorie (facultative)', 'الفئة (اختيارية)')}
        <select
          disabled={disabled}
          value={item.categoryId || (legacy ? 'legacy-category' : '')}
          onChange={(e) => {
            const id = e.target.value;
            if (id !== 'legacy-category') setData((d: any) => assignItemCategory(d, itemId, id));
            setEditor(null);
          }}
        >
          <option value="">{t('Sans catégorie', 'بلا فئة')}</option>
          {legacy && (
            <option value="legacy-category">
              {catalogText(item.category, item.categoryAr, ar)}
            </option>
          )}
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {catalogText(c.nameFr, c.nameAr, ar)}
            </option>
          ))}
        </select>
      </label>
      {!editor && (
        <div className="catalog-actions">
          <button
            type="button"
            disabled={disabled || cats.length >= 40}
            onClick={() => setEditor({ id: '', name: '', visible: true })}
          >
            {t('Nouvelle catégorie', 'فئة جديدة')}
          </button>
          {selected && (
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                setEditor({
                  id: selected.id,
                  visible: selected.visible,
                  name: language === 'Fr' ? selected.nameFr : selected.nameAr,
                })
              }
            >
              {t('Modifier la catégorie', 'تعديل الفئة')}
            </button>
          )}
        </div>
      )}
      {editor && (
        <div className="catalog-options">
          <label className="field">
            {language === 'Fr'
              ? t('Nom de la catégorie en français', 'اسم الفئة بالفرنسية')
              : t('Nom de la catégorie en arabe', 'اسم الفئة بالعربية')}
            <input
              value={editor.name}
              maxLength={120}
              disabled={disabled}
              lang={language.toLowerCase()}
              dir={language === 'Ar' ? 'rtl' : 'ltr'}
              onChange={(e) => setEditor({ ...editor, name: e.target.value })}
            />
          </label>
          {editor.id && (
            <>
              <p className="hint">
                {t(
                  'La modification concerne tous les articles de cette catégorie.',
                  'التعديل كيخص جميع المنتجات ديال هاد الفئة.',
                )}
              </p>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={editor.visible}
                  disabled={disabled}
                  onChange={(e) => setEditor({ ...editor, visible: e.target.checked })}
                />
                {t('Afficher cette catégorie et ses articles', 'إظهار هاد الفئة والمنتجات ديالها')}
              </label>
            </>
          )}
          <div className="catalog-actions">
            <button
              type="button"
              disabled={disabled || !editor.name.trim()}
              onClick={() => {
                const id = editor.id || crypto.randomUUID();
                setData((d: any) =>
                  saveItemCategory(
                    d,
                    itemId,
                    language,
                    editor.name,
                    editor.id,
                    id,
                    editor.visible,
                  ),
                );
                setEditor(null);
              }}
            >
              {editor.id ? t('Appliquer', 'تطبيق') : t('Ajouter', 'إضافة')}
            </button>
            <button type="button" disabled={disabled} onClick={() => setEditor(null)}>
              {t('Annuler', 'إلغاء')}
            </button>
            {editor.id && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (
                    window.confirm(
                      t(
                        'Supprimer cette catégorie ? Ses articles seront sans catégorie.',
                        'واش تحذف هاد الفئة؟ المنتجات ديالها غادي تبقى بلا فئة.',
                      ),
                    )
                  ) {
                    setData((d: any) => removeItemCategory(d, editor.id));
                    setEditor(null);
                  }
                }}
              >
                {t('Supprimer la catégorie', 'حذف الفئة')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
