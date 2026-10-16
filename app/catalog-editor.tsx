'use client';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  catalogRights,
  catalogDocuments,
  catalogSettings,
  catalogCategories,
  catalogText,
} from './lib/catalog-menu';
import { normalizeCatalogue } from './lib/catalogue';
import { compressPhoto } from './lib/compress-photo';
import ImageCropper from './image-cropper';
import PdfCatalogue from './pdf-catalogue';
import { PhotoPreview } from './photo-gallery';
export default function CatalogEditor({
  data,
  setData,
  subscription,
  ar,
  busy,
  save,
  onMessage,
}: {
  data: any;
  setData: Dispatch<SetStateAction<any>>;
  subscription: any;
  ar: boolean;
  busy: boolean;
  save: () => Promise<void>;
  onMessage: (s: string) => void;
}) {
  const t = (fr: string, arabic: string) => (ar ? arabic : fr);
  const rights = catalogRights(subscription),
    settings = catalogSettings(data),
    docs = catalogDocuments(data),
    cats = catalogCategories(data),
    items = normalizeCatalogue(data.services, true);
  const [tab, setTab] = useState('pdf'),
    [working, setWorking] = useState(false),
    [preview, setPreview] = useState(''),
    [crop, setCrop] = useState<{ source: File | string; apply: (f: File) => Promise<void> } | null>(
      null,
    );
  const locked = busy || working;
  const patch = (key: string, value: any) => setData((d: any) => ({ ...d, [key]: value }));
  const updateItem = (id: string, key: string, value: any) =>
    setData((d: any) => ({
      ...d,
      services: normalizeCatalogue(d.services, true).map((p) =>
        p.id === id ? { ...p, [key]: value } : p,
      ),
    }));
  const updateDoc = (id: string, key: string, value: any) =>
    setData((d: any) => ({
      ...d,
      pdf: '',
      catalogDocuments: catalogDocuments(d).map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  function reorder(key: string, index: number, delta: number) {
    setData((d: any) => {
      const list =
        key === 'catalogDocuments'
          ? catalogDocuments(d)
          : key === 'catalogCategories'
            ? catalogCategories(d)
            : normalizeCatalogue(d.services, true);
      const target = index + delta;
      if (target < 0 || target >= list.length) return d;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, [key]: next, ...(key === 'catalogDocuments' ? { pdf: '' } : {}) };
    });
  }
  async function send(file: File, purpose = 'catalog-image') {
    const form = new FormData();
    form.set('file', file);
    form.set('purpose', purpose);
    const r = await fetch('/api/upload', { method: 'POST', body: form });
    const b: any = await r.json();
    if (!r.ok) throw Error(ar ? b.errorAr || 'تعذر استيراد الملف.' : b.error);
    return b.url as string;
  }
  async function run(fn: () => Promise<void>) {
    if (locked) return;
    setWorking(true);
    try {
      await fn();
      onMessage(
        t(
          'Importation terminée. Enregistrez pour publier les modifications.',
          'تم الاستيراد. سجّل باش تنشر التغييرات.',
        ),
      );
    } catch (e: any) {
      onMessage(
        ar && !/[\u0600-\u06ff]/.test(e.message || '')
          ? 'تعذر الاستيراد. تأكد من صيغة الملف وحجمه والاتصال وعاود جرّب.'
          : e.name === 'TypeError'
            ? 'Importation impossible. Vérifiez le fichier et votre connexion, puis réessayez.'
            : e.message,
      );
    } finally {
      setWorking(false);
    }
  }
  async function photo(file: File, purpose = 'catalog-image') {
    return send(await compressPhoto(file), purpose);
  }
  const moves = (key: string, i: number, count: number) => (
    <span className="catalog-actions">
      <button
        type="button"
        disabled={locked || i === 0}
        onClick={() => reorder(key, i, -1)}
        aria-label={t('Monter', 'طلع')}
      >
        ↑
      </button>
      <button
        type="button"
        disabled={locked || i === count - 1}
        onClick={() => reorder(key, i, 1)}
        aria-label={t('Descendre', 'هبط')}
      >
        ↓
      </button>
    </span>
  );
  const input = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: any = {},
  ) => (
    <label className="field">
      {label}
      <input
        value={value || ''}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        {...options}
      />
    </label>
  );
  const toggle = (
    label: string,
    value: boolean,
    onChange: (v: boolean) => void,
    disabled = false,
  ) => (
    <label className="toggle">
      <input
        type="checkbox"
        checked={value}
        disabled={locked || disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
  async function applyPhoto(
    file: File,
    set: (v: string) => void,
    thumbnail: ((v: string) => void) | undefined,
    purpose: string,
  ) {
    await run(async () => {
      const main = await photo(file, purpose);
      const small = thumbnail ? await send(await compressPhoto(file, 480), purpose) : '';
      set(main);
      thumbnail?.(small);
    });
    setCrop(null);
  }
  const media = (
    src: string,
    set: (v: string) => void,
    disabled = false,
    thumbnail?: (v: string) => void,
    purpose = 'catalog-image',
  ) => (
    <div className="catalog-media-editor">
      {src && (
        <>
          <PhotoPreview src={src} ar={ar} alt={t('Photo', 'صورة')} />
          <button
            type="button"
            disabled={locked || disabled}
            onClick={() =>
              setCrop({
                source: src,
                apply: async (f) => {
                  await applyPhoto(f, set, thumbnail, purpose);
                },
              })
            }
          >
            {t('Recadrer', 'تأطير')}
          </button>
          <button
            type="button"
            disabled={locked || disabled}
            onClick={() => {
              set('');
              thumbnail?.('');
            }}
          >
            {t('Retirer', 'حذف')}
          </button>
        </>
      )}
      <label className="field">
        {t('Choisir et recadrer une photo', 'اختيار وتأطير صورة')}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={locked || disabled}
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (f)
              setCrop({
                source: f,
                apply: async (f) => {
                  await applyPhoto(f, set, thumbnail, purpose);
                },
              });
          }}
        />
      </label>
    </div>
  );
  return (
    <section className="panel catalog-editor" dir={ar ? 'rtl' : 'ltr'}>
      <h2>{t('Catalogue / Menu', 'الكاتالوگ / القائمة')}</h2>
      <p className="hint">
        {t(
          'Les contenus français et arabes se saisissent séparément. Aucune traduction automatique. Enregistrez pour publier.',
          'دخل المحتوى الفرنسي والعربي بشكل مستقل. ما كايناش ترجمة تلقائية. سجّل باش تنشر.',
        )}
      </p>
      {!rights.enabled && (
        <p role="status">
          {t(
            'Module désactivé pour votre compte. Contactez SoraLink.',
            'هاد القسم ما مفعّلش فالحساب ديالك. تواصل مع سورالينك.',
          )}
        </p>
      )}
      <div
        className="catalog-tabs"
        role="tablist"
        aria-label={t('Gestion du catalogue', 'إدارة الكاتالوگ')}
      >
        {[
          ['pdf', 'PDF', 'ملفات'],
          ['products', 'Produits', 'المنتجات'],
          ['appearance', 'Apparence', 'المظهر'],
        ].map(([key, fr, a]) => (
          <button
            type="button"
            key={key}
            role="tab"
            id={'catalog-tab-' + key}
            aria-controls={'catalog-panel-' + key}
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            {t(fr, a)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={'catalog-panel-' + tab} aria-labelledby={'catalog-tab-' + tab}>
        {tab === 'pdf' && (
          <fieldset disabled={locked || !rights.enabled || !rights.pdf}>
            <legend>{t('Documents PDF', 'الوثائق')}</legend>
            <p className="hint">
              {t(
                `${docs.length}/${rights.maxDocuments} documents · ${rights.pdfMB} Mo et ${rights.pdfPages} pages par document`,
                `${docs.length}/${rights.maxDocuments} وثائق · ${rights.pdfMB} ميغابايت و${rights.pdfPages} صفحة لكل وثيقة`,
              )}
            </p>
            {docs.map((doc, i) => (
              <article className="catalogue-editor" key={doc.id}>
                <div className="panel-title">
                  <h3>
                    {t('Document', 'وثيقة')} {i + 1}
                  </h3>
                  {moves('catalogDocuments', i, docs.length)}
                </div>
                <div className="form-grid">
                  {input(
                    t('Titre en français', 'العنوان بالفرنسية'),
                    doc.titleFr,
                    (v) => updateDoc(doc.id, 'titleFr', v),
                    { maxLength: 120, lang: 'fr', dir: 'ltr' },
                  )}
                  {input(
                    t('Titre en arabe', 'العنوان بالعربية'),
                    doc.titleAr,
                    (v) => updateDoc(doc.id, 'titleAr', v),
                    { maxLength: 120, lang: 'ar', dir: 'rtl' },
                  )}
                </div>
                {(['Fr', 'Ar'] as const).map((lang) => (
                  <label className="field" key={lang}>
                    {lang === 'Fr'
                      ? t('Description en français', 'الوصف بالفرنسية')
                      : t('Description en arabe', 'الوصف بالعربية')}
                    <textarea
                      maxLength={800}
                      lang={lang === 'Fr' ? 'fr' : 'ar'}
                      dir={lang === 'Fr' ? 'ltr' : 'rtl'}
                      value={doc[('description' + lang) as 'descriptionFr']}
                      onChange={(e) => updateDoc(doc.id, 'description' + lang, e.target.value)}
                    />
                  </label>
                ))}
                {media(
                  doc.cover,
                  (v) => updateDoc(doc.id, 'cover', v),
                  false,
                  undefined,
                  'catalog-cover',
                )}
                {toggle(t('Document visible', 'الوثيقة ظاهرة'), doc.visible, (v) =>
                  updateDoc(doc.id, 'visible', v),
                )}
                {toggle(
                  t('Autoriser le téléchargement volontaire', 'السماح بتحميل الملف'),
                  doc.allowDownload,
                  (v) => updateDoc(doc.id, 'allowDownload', v),
                  !rights.downloads,
                )}
                <label className="field">
                  {t('Remplacer le PDF (adresse conservée)', 'تبديل الملف مع الحفاظ على الرابط')}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      e.currentTarget.value = '';
                      if (file)
                        void run(async () =>
                          updateDoc(doc.id, 'src', await send(file, 'catalog-pdf')),
                        );
                    }}
                  />
                </label>
                <div className="catalog-actions">
                  <button
                    type="button"
                    onClick={() => setPreview(preview === doc.id ? '' : doc.id)}
                  >
                    {t('Prévisualiser', 'معاينة')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            'Supprimer ce document ? Enregistrez pour confirmer la suppression.',
                            'واش بغيتي تحذف هاد الوثيقة؟ سجّل باش تأكّد الحذف.',
                          ),
                        )
                      )
                        setData((d: any) => ({
                          ...d,
                          pdf: '',
                          catalogDocuments: catalogDocuments(d).filter((p) => p.id !== doc.id),
                        }));
                    }}
                  >
                    {t('Supprimer', 'حذف')}
                  </button>
                </div>
                {preview === doc.id && <PdfCatalogue src={doc.src} ar={ar} />}
              </article>
            ))}
            <label className="field">
              {t('Importer un ou plusieurs PDF', 'استيراد ملف واحد أو أكثر')}
              <input
                type="file"
                multiple
                accept="application/pdf"
                disabled={locked || docs.length >= rights.maxDocuments}
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files || []);
                  e.currentTarget.value = '';
                  void run(async () => {
                    if (docs.length + files.length > rights.maxDocuments)
                      throw Error(
                        t(
                          'Nombre maximal de documents atteint.',
                          'وصلتي للحد الأقصى ديال الوثائق.',
                        ),
                      );
                    for (const file of files) {
                      const src = await send(file, 'catalog-pdf');
                      const doc = {
                        id: crypto.randomUUID(),
                        src,
                        titleFr: '',
                        titleAr: '',
                        descriptionFr: '',
                        descriptionAr: '',
                        cover: '',
                        visible: true,
                        allowDownload: false,
                      };
                      setData((d: any) => ({
                        ...d,
                        pdf: '',
                        catalogDocuments: [...catalogDocuments(d), doc],
                      }));
                    }
                  });
                }}
              />
            </label>
          </fieldset>
        )}
        {tab === 'products' && (
          <fieldset disabled={locked || !rights.enabled || !rights.products}>
            <legend>{t('Catégories et articles', 'الفئات والمنتجات')}</legend>
            <details>
              <summary>
                {t('Gérer les catégories', 'إدارة الفئات')} ({cats.length}/40)
              </summary>
              {cats.map((cat, i) => (
                <div className="catalogue-editor" key={cat.id}>
                  <div className="form-grid">
                    {input(
                      t('Nom français', 'الاسم بالفرنسية'),
                      cat.nameFr,
                      (v) =>
                        patch(
                          'catalogCategories',
                          cats.map((c) => (c.id === cat.id ? { ...c, nameFr: v } : c)),
                        ),
                      { maxLength: 120, lang: 'fr', dir: 'ltr' },
                    )}
                    {input(
                      t('Nom arabe', 'الاسم بالعربية'),
                      cat.nameAr,
                      (v) =>
                        patch(
                          'catalogCategories',
                          cats.map((c) => (c.id === cat.id ? { ...c, nameAr: v } : c)),
                        ),
                      { maxLength: 120, lang: 'ar', dir: 'rtl' },
                    )}
                  </div>
                  {toggle(t('Catégorie visible', 'الفئة ظاهرة'), cat.visible, (v) =>
                    patch(
                      'catalogCategories',
                      cats.map((c) => (c.id === cat.id ? { ...c, visible: v } : c)),
                    ),
                  )}
                  {moves('catalogCategories', i, cats.length)}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            'Supprimer cette catégorie ? Les articles seront sans catégorie.',
                            'حذف هاد الفئة؟ المنتجات غادي تبقى بلا فئة.',
                          ),
                        )
                      )
                        setData((d: any) => ({
                          ...d,
                          catalogCategories: cats.filter((c) => c.id !== cat.id),
                          services: normalizeCatalogue(d.services, true).map((p) =>
                            p.categoryId === cat.id ? { ...p, categoryId: '' } : p,
                          ),
                        }));
                    }}
                  >
                    {t('Supprimer la catégorie', 'حذف الفئة')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={locked || cats.length >= 40}
                onClick={() =>
                  patch('catalogCategories', [
                    ...cats,
                    { id: crypto.randomUUID(), nameFr: '', nameAr: '', visible: true },
                  ])
                }
              >
                {t('Ajouter une catégorie', 'إضافة فئة')}
              </button>
            </details>
            <p>
              {items.length}/{rights.maxProducts} {t('articles', 'منتجات')}
            </p>
            {items.map((item, i) => (
              <details className="catalogue-editor" key={item.id} open={!item.name}>
                <summary>
                  {catalogText(item.nameFr, item.nameAr, ar)} · {i + 1}
                </summary>
                <div className="catalog-actions">
                  {moves('services', i, items.length)}
                  <button
                    type="button"
                    disabled={locked || items.length >= rights.maxProducts}
                    onClick={() =>
                      patch('services', [...items, { ...item, id: crypto.randomUUID() }])
                    }
                  >
                    {t('Dupliquer', 'نسخ')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('Supprimer cet article ?', 'حذف هاد المنتج؟')))
                        patch(
                          'services',
                          items.filter((p) => p.id !== item.id),
                        );
                    }}
                  >
                    {t('Supprimer', 'حذف')}
                  </button>
                </div>
                <div className="form-grid">
                  {input(
                    t('Nom en français', 'الاسم بالفرنسية'),
                    item.nameFr,
                    (v) => {
                      setData((d: any) => ({
                        ...d,
                        services: normalizeCatalogue(d.services, true).map((p) =>
                          p.id === item.id ? { ...p, nameFr: v, name: v || p.nameAr } : p,
                        ),
                      }));
                    },
                    { maxLength: 120, lang: 'fr', dir: 'ltr' },
                  )}
                  {input(
                    t('Nom en arabe', 'الاسم بالعربية'),
                    item.nameAr,
                    (v) => updateItem(item.id, 'nameAr', v),
                    { maxLength: 120, lang: 'ar', dir: 'rtl' },
                  )}
                </div>
                <div className="form-grid">
                  <label className="field">
                    {t('Description en français', 'الوصف بالفرنسية')}
                    <textarea
                      lang="fr"
                      dir="ltr"
                      maxLength={800}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    {t('Description en arabe', 'الوصف بالعربية')}
                    <textarea
                      lang="ar"
                      dir="rtl"
                      maxLength={800}
                      value={item.descriptionAr}
                      onChange={(e) => updateItem(item.id, 'descriptionAr', e.target.value)}
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label className="field">
                    {t('Type', 'النوع')}
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                    >
                      <option value="product">{t('Produit', 'منتج')}</option>
                      <option value="service">{t('Service', 'خدمة')}</option>
                    </select>
                  </label>
                  <label className="field">
                    {t('Catégorie', 'الفئة')}
                    <select
                      value={item.categoryId}
                      onChange={(e) => updateItem(item.id, 'categoryId', e.target.value)}
                    >
                      <option value="">{t('Sans catégorie', 'بلا فئة')}</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {catalogText(c.nameFr, c.nameAr, ar)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {input(
                    t('Référence', 'المرجع'),
                    item.reference,
                    (v) => updateItem(item.id, 'reference', v),
                    { maxLength: 80 },
                  )}
                  {input(
                    t('Prix en dirhams (facultatif)', 'الثمن بالدرهم (اختياري)'),
                    item.price,
                    (v) => updateItem(item.id, 'price', v),
                    { inputMode: 'decimal', maxLength: 30 },
                  )}
                  {input(
                    t('Ancien prix (facultatif)', 'الثمن القديم (اختياري)'),
                    item.oldPrice,
                    (v) => updateItem(item.id, 'oldPrice', v),
                    { inputMode: 'decimal', maxLength: 30 },
                  )}
                  <label className="field">
                    {t('Disponibilité', 'التوفر')}
                    <select
                      value={item.availability}
                      onChange={(e) => updateItem(item.id, 'availability', e.target.value)}
                    >
                      <option value="available">{t('Disponible', 'متوفر')}</option>
                      <option value="soldout">{t('Épuisé', 'نفد')}</option>
                      <option value="hidden">{t('Masqué', 'مخفي')}</option>
                    </select>
                  </label>
                </div>
                {toggle(t('Badge promotion', 'شارة التخفيض'), item.promotion, (v) =>
                  updateItem(item.id, 'promotion', v),
                )}
                {item.promotion && (
                  <div className="form-grid">
                    {input(
                      t('Début de promotion', 'بداية التخفيض'),
                      item.promoStart,
                      (v) => updateItem(item.id, 'promoStart', v),
                      { type: 'date' },
                    )}
                    {input(
                      t('Fin de promotion', 'نهاية التخفيض'),
                      item.promoEnd,
                      (v) => updateItem(item.id, 'promoEnd', v),
                      { type: 'date' },
                    )}
                  </div>
                )}
                <h4>{t('Image principale', 'الصورة الرئيسية')}</h4>
                {media(
                  item.image,
                  (v) => updateItem(item.id, 'image', v),
                  false,
                  (v) => updateItem(item.id, 'thumbnail', v),
                )}
                <h4>{t('Galerie (5 photos supplémentaires)', 'الصور الإضافية (حتى 5)')}</h4>
                <div className="catalog-gallery-editor">
                  {item.images.map((src, n) => (
                    <div key={src}>
                      {media(src, (v) =>
                        updateItem(
                          item.id,
                          'images',
                          v
                            ? item.images.map((u, k) => (k === n ? v : u))
                            : item.images.filter((_, k) => k !== n),
                        ),
                      )}
                    </div>
                  ))}
                </div>
                <label className="field">
                  {t('Importer plusieurs photos', 'استيراد عدة صور')}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    disabled={locked || item.images.length >= 5}
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files || []);
                      e.currentTarget.value = '';
                      void run(async () => {
                        if (item.images.length + files.length > 5)
                          throw Error(
                            t(
                              'Cinq photos supplémentaires maximum.',
                              'الحد الأقصى خمس صور إضافية.',
                            ),
                          );
                        for (const f of files) {
                          const src = await photo(f);
                          setData((d: any) => ({
                            ...d,
                            services: normalizeCatalogue(d.services, true).map((p) =>
                              p.id === item.id ? { ...p, images: [...p.images, src] } : p,
                            ),
                          }));
                        }
                      });
                    }}
                  />
                </label>
              </details>
            ))}
            <button
              type="button"
              disabled={locked || items.length >= rights.maxProducts}
              onClick={() =>
                patch('services', [
                  ...items,
                  {
                    id: crypto.randomUUID(),
                    name: '',
                    nameFr: '',
                    nameAr: '',
                    description: '',
                    descriptionAr: '',
                    category: '',
                    price: '',
                    image: '',
                    images: [],
                    type: 'product',
                    availability: 'available',
                  },
                ])
              }
            >
              {t('Ajouter un produit ou service', 'إضافة منتج أو خدمة')}
            </button>
          </fieldset>
        )}
        {tab === 'appearance' && (
          <fieldset disabled={locked || !rights.enabled}>
            <legend>{t('Présentation du catalogue', 'مظهر الكاتالوگ')}</legend>
            {[
              ['enabled', 'Activer le module', 'تفعيل القسم'],
              ['pdf', 'Afficher les PDF', 'إظهار الوثائق'],
              ['products', 'Afficher les produits', 'إظهار المنتجات'],
              ['whatsapp', 'Commandes WhatsApp', 'طلبات واتساب'],
              ['showPrices', 'Afficher les prix', 'إظهار الأثمنة'],
            ].map(([key, fr, a]) => (
              <div key={key}>
                {toggle(
                  t(fr, a),
                  settings[key as 'enabled'] as boolean,
                  (v) => patch('catalogSettings', { ...settings, [key]: v }),
                  key === 'pdf'
                    ? !rights.pdf
                    : key === 'products'
                      ? !rights.products
                      : key === 'whatsapp'
                        ? !rights.whatsapp
                        : false,
                )}
              </div>
            ))}
            <label className="field">
              {t('Disposition', 'التنسيق')}
              <select
                value={settings.layout}
                onChange={(e) => patch('catalogSettings', { ...settings, layout: e.target.value })}
              >
                <option value="grid">{t('Grille', 'شبكة')}</option>
                <option value="list">{t('Liste', 'لائحة')}</option>
              </select>
            </label>
            {input(
              t('Couleur d’accent', 'لون العناصر'),
              settings.accent || '#0f766e',
              (v) => patch('catalogSettings', { ...settings, accent: v }),
              { type: 'color' },
            )}
            <button
              type="button"
              onClick={() => patch('catalogSettings', { ...settings, accent: '' })}
            >
              {t('Utiliser la couleur de la carte', 'استعمال لون البطاقة')}
            </button>
          </fieldset>
        )}
      </div>
      <p className="hint">
        {t(
          `Stockage partagé avec votre carte : ${rights.storageMB} Mo, ${rights.maxFiles} fichiers maximum.`,
          `التخزين مشترك مع البطاقة: ${rights.storageMB} ميغابايت و${rights.maxFiles} ملف كحد أقصى.`,
        )}
      </p>
      <button type="button" className="primary full" disabled={locked} onClick={save}>
        {working
          ? t('Importation…', 'جاري الاستيراد…')
          : t('Enregistrer les modifications', 'حفظ التغييرات')}
      </button>
      {crop && (
        <ImageCropper
          source={crop.source}
          target="product"
          ar={ar}
          circle={false}
          onCancel={() => setCrop(null)}
          onApply={crop.apply}
        />
      )}
    </section>
  );
}
