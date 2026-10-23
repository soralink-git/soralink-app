'use client';
import type { CatalogueVariant } from './lib/catalogue';
export default function CatalogVariantsEditor({
  variants,
  onChange,
  ar,
  disabled,
}: {
  variants: CatalogueVariant[];
  onChange: (v: CatalogueVariant[]) => void;
  ar: boolean;
  disabled: boolean;
}) {
  const t = (fr: string, a: string) => (ar ? a : fr);
  const patch = (id: string, key: string, value: string) =>
    onChange(variants.map((v) => (v.id === id ? { ...v, [key]: value } : v)));
  return (
    <details className="catalog-options">
      <summary>
        {t('Variantes (facultatives)', 'الاختيارات (اختيارية)')}{' '}
        {variants.length > 0 ? ' · ' + variants.length : ''}
      </summary>
      <p className="hint">
        {t(
          'Par exemple : taille, format ou prestation. Un prix vide reprend le prix de l’article.',
          'مثلاً: القياس، الحجم ولا الخدمة. إلا خليتي الثمن خاوي كيتستعمل ثمن المنتج.',
        )}
      </p>
      {variants.map((v, i) => (
        <fieldset className="catalog-variant-row" key={v.id} disabled={disabled}>
          <legend>
            {t('Variante', 'اختيار')} {i + 1}
          </legend>
          <label className="field">
            {t('Nom en français', 'الاسم بالفرنسية')}
            <input
              dir="ltr"
              lang="fr"
              maxLength={80}
              value={v.nameFr}
              onChange={(e) => patch(v.id, 'nameFr', e.target.value)}
            />
          </label>
          <label className="field">
            {t('Nom en arabe', 'الاسم بالعربية')}
            <input
              dir="rtl"
              lang="ar"
              maxLength={80}
              value={v.nameAr}
              onChange={(e) => patch(v.id, 'nameAr', e.target.value)}
            />
          </label>
          <label className="field">
            {t('Prix en DH (facultatif)', 'الثمن بالدرهم (اختياري)')}
            <input
              inputMode="decimal"
              maxLength={30}
              value={v.price}
              onChange={(e) => patch(v.id, 'price', e.target.value)}
            />
          </label>
          <label className="field">
            {t('Disponibilité', 'التوفر')}
            <select
              value={v.availability}
              onChange={(e) => patch(v.id, 'availability', e.target.value)}
            >
              <option value="available">{t('Disponible', 'متوفر')}</option>
              <option value="soldout">{t('Épuisé', 'نفد')}</option>
            </select>
          </label>
          <button
            type="button"
            className="danger"
            onClick={() => onChange(variants.filter((x) => x.id !== v.id))}
          >
            {t('Supprimer cette variante', 'حيد هاد الاختيار')}
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={disabled || variants.length >= 12}
        onClick={() =>
          onChange([
            ...variants,
            {
              id: crypto.randomUUID(),
              nameFr: ar ? '' : 'Variante ' + (variants.length + 1),
              nameAr: ar ? 'اختيار ' + (variants.length + 1) : '',
              price: '',
              availability: 'available',
            },
          ])
        }
      >
        {t('Ajouter une variante', 'زيد اختيار')}
      </button>
    </details>
  );
}
