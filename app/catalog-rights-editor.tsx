'use client';
import { useState } from 'react';
import { catalogRights, type CatalogRights } from './lib/catalog-menu';
export default function CatalogRightsEditor({
  profile,
  ar,
  busy,
  onSave,
}: {
  profile: any;
  ar: boolean;
  busy: boolean;
  onSave: (b: any) => void;
}) {
  const [rights, setRights] = useState<CatalogRights>(() => catalogRights(profile));
  const t = (fr: string, a: string) => (ar ? a : fr);
  const booleans = [
    ['enabled', 'Activer Catalogue / Menu', 'تفعيل الكاتالوگ / القائمة'],
    ['pdf', 'Lecture et gestion PDF', 'قراءة وإدارة الوثائق'],
    ['products', 'Catalogue interactif', 'الكاتالوگ التفاعلي'],
    ['whatsapp', 'Commandes WhatsApp', 'طلبات واتساب'],
    ['downloads', 'Téléchargement PDF autorisé', 'السماح بتحميل الوثائق'],
  ] as const;
  const numbers = [
    ['maxDocuments', 'Nombre de PDF', 'عدد الوثائق', 0, 10],
    ['maxProducts', 'Nombre de produits', 'عدد المنتجات', 0, 200],
    ['storageMB', 'Stockage total en Mo', 'حجم التخزين بالميغابايت', 1, 2000],
    ['maxFiles', 'Nombre total de fichiers', 'عدد الملفات', 1, 500],
    ['pdfMB', 'Taille par PDF en Mo', 'حجم كل وثيقة بالميغابايت', 1, 25],
    ['pdfPages', 'Pages par PDF', 'صفحات كل وثيقة', 1, 100],
  ] as const;
  return (
    <form
      className="panel catalog-rights"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ action: 'catalogRights', id: profile.id, rights });
      }}
    >
      <details>
        <summary>{t('Droits Catalogue / Menu', 'صلاحيات الكاتالوگ / القائمة')}</summary>
        <p className="hint">
          {t(
            'Ces droits s’appliquent côté serveur et immédiatement à cette carte. Une baisse de quota conserve les données enregistrées, limite leur affichage public et bloque les ajouts.',
            'هاد الصلاحيات كتطبق فالسيرفر ومباشرة على البطاقة. تخفيض الحدود كيحافظ على البيانات وكيحد العرض والإضافات.',
          )}
        </p>
        {booleans.map(([key, fr, a]) => (
          <label className="toggle" key={key}>
            <input
              type="checkbox"
              disabled={busy}
              checked={rights[key]}
              onChange={(e) => setRights((r) => ({ ...r, [key]: e.target.checked }))}
            />
            {t(fr, a)}
          </label>
        ))}
        <div className="form-grid">
          {numbers.map(([key, fr, a, min, max]) => (
            <label className="field" key={key}>
              {t(fr, a)}
              <input
                type="number"
                required
                disabled={busy}
                min={min}
                max={max}
                value={rights[key]}
                onChange={(e) => setRights((r) => ({ ...r, [key]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </div>
        <div className="catalog-actions">
          <button className="primary" disabled={busy}>
            {t('Enregistrer les droits', 'حفظ الصلاحيات')}
          </button>
          <button
            className="secondary"
            type="button"
            disabled={busy}
            onClick={() => {
              const defaults = catalogRights({
                ...profile,
                catalog_rights: null,
                catalogRights: null,
              });
              setRights(defaults);
              onSave({ action: 'catalogRights', id: profile.id, rights: null });
            }}
          >
            {t('Rétablir les limites du forfait', 'استرجاع حدود الاشتراك')}
          </button>
        </div>
      </details>
    </form>
  );
}
