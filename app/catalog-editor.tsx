'use client';
import { useState } from 'react';
import type { Dispatch, SetStateAction, ReactNode } from 'react';
import {
  catalogRights,
  catalogDocuments,
  catalogSettings,
  catalogCategories,
  catalogText,
} from './lib/catalog-menu';
import { normalizeCatalogue, cataloguePrice } from './lib/catalogue';
import { compressPhoto } from './lib/compress-photo';
import ImageCropper from './image-cropper';
import PdfCatalogue from './pdf-catalogue';
import ItemCategoryField from './item-category-field';
import { PhotoPreview } from './photo-gallery';
export default function CatalogEditor({
  data,
  setData,
  subscription,
  ar,
  busy,
  onMessage,
  onBusyChange,
  initialTab,
  promotionsEditor,
}: {
  initialTab?: 'pdf' | 'products' | 'media' | 'appearance' | 'promotions';
  promotionsEditor?: ReactNode;
  data: any;
  setData: Dispatch<SetStateAction<any>>;
  subscription: any;
  ar: boolean;
  busy: boolean;
  onBusyChange?: (value: boolean) => void;
  onMessage: (s: string) => void;
}) {
  const t = (fr: string, arabic: string) => (ar ? arabic : fr);
  const rights = catalogRights(subscription),
    settings = catalogSettings(data),
    docs = catalogDocuments(data),
    items = normalizeCatalogue(data.services, true);
  const [tab, setTab] = useState<string>(
      initialTab === 'media'
        ? 'promotions'
        : initialTab === 'appearance'
          ? 'products'
          : initialTab || 'products',
    ),
    [language, setLanguage] = useState<'Fr' | 'Ar'>(ar ? 'Ar' : 'Fr'),
    [expandedItem, setExpandedItem] = useState(() => items.find((p) => !p.name)?.id || ''),
    [expandedDoc, setExpandedDoc] = useState(''),
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
    onBusyChange?.(true);
    try {
      await fn();
      onMessage(
        t(
          'Importation terminée. Enregistrement automatique en cours.',
          'تم الاستيراد. التغييرات كيتسجلو تلقائياً.',
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
      onBusyChange?.(false);
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
      <h2>{t('Produits et services', 'المنتجات والخدمات')}</h2>
      <p className="hint">
        {t(
          'Ajoutez ce que vous proposez. Les modifications sont enregistrées automatiquement.',
          'زيد المنتجات والخدمات ديالك. التغييرات كيتسجلو تلقائياً.',
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
          ['products', 'Produits / services', 'منتجات وخدمات'],
          ['pdf', 'Documents PDF', 'وثائق PDF'],
          ...(promotionsEditor
            ? [['promotions', 'Offres et promotions', 'العروض والتخفيضات']]
            : []),
        ].map(([key, fr, a]) => (
          <button
            type="button"
            key={key}
            role="tab"
            id={'catalog-tab-' + key}
            aria-controls={'catalog-panel-' + key}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onKeyDown={(e) => {
              const buttons = Array.from(
                e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
              );
              const index = buttons.indexOf(e.currentTarget);
              let next = index;
              if (e.key === 'Home') next = 0;
              else if (e.key === 'End') next = buttons.length - 1;
              else if (e.key === 'ArrowRight')
                next = (index + (ar ? -1 : 1) + buttons.length) % buttons.length;
              else if (e.key === 'ArrowLeft')
                next = (index + (ar ? 1 : -1) + buttons.length) % buttons.length;
              else return;
              e.preventDefault();
              buttons[next].click();
              buttons[next].focus();
            }}
            onClick={() => setTab(key)}
          >
            {t(fr, a)}
          </button>
        ))}
      </div>
      {(tab === 'products' || tab === 'pdf') && (
        <details className="catalog-language">
          <summary>{t('Langue et traduction', 'اللغة والترجمة')}</summary>
          <label className="field">
            {t('Langue du contenu à modifier', 'لغة المحتوى اللي بغيتي تبدّل')}
            <select value={language} onChange={(e) => setLanguage(e.target.value as 'Fr' | 'Ar')}>
              <option value="Fr">{t('Français', 'الفرنسية')}</option>
              <option value="Ar">{t('Arabe', 'العربية')}</option>
            </select>
            <span className="hint">
              {t(
                'La traduction est facultative et se saisit séparément.',
                'الترجمة اختيارية وكتدخلها بوحدها.',
              )}
            </span>
          </label>
        </details>
      )}
      <div role="tabpanel" id={'catalog-panel-' + tab} aria-labelledby={'catalog-tab-' + tab}>
        {tab === 'promotions' && promotionsEditor}
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
              <details
                className="catalogue-editor"
                key={doc.id}
                open={expandedDoc === doc.id}
                onToggle={(e) => {
                  const open = e.currentTarget.open;
                  setExpandedDoc((current) => (open ? doc.id : current === doc.id ? '' : current));
                }}
              >
                <summary>
                  {catalogText(doc.titleFr, doc.titleAr, ar, true) ||
                    t('Nouveau document', 'وثيقة جديدة')}
                </summary>
                <div className="panel-title">
                  <h3>
                    {t('Document', 'وثيقة')} {i + 1}
                  </h3>
                  {moves('catalogDocuments', i, docs.length)}
                </div>
                {input(
                  t('Titre', 'العنوان'),
                  language === 'Fr' ? doc.titleFr : doc.titleAr,
                  (v) => updateDoc(doc.id, 'title' + language, v),
                  {
                    maxLength: 120,
                    lang: language.toLowerCase(),
                    dir: language === 'Ar' ? 'rtl' : 'ltr',
                  },
                )}
                <details className="catalog-options">
                  <summary>
                    {t('Description, couverture et téléchargement', 'الوصف والغلاف والتحميل')}
                  </summary>
                  {[language].map((lang) => (
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
                </details>
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
                            'Supprimer ce document ? La suppression sera enregistrée automatiquement.',
                            'واش بغيتي تحذف هاد الوثيقة؟ الحذف غادي يتسجّل تلقائياً.',
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
              </details>
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
                      setExpandedDoc(doc.id);
                    }
                  });
                }}
              />
            </label>
          </fieldset>
        )}
        {tab === 'products' && (
          <fieldset disabled={locked || !rights.enabled || !rights.products}>
            <legend>
              {t('Votre liste de produits et services', 'لائحة المنتجات والخدمات ديالك')}
            </legend>
            <p>
              {items.length}/{rights.maxProducts} {t('articles', 'منتجات')}
            </p>
            <p className="hint">
              {t(
                'Cette limite est partagée entre toutes vos catégories.',
                'هاد الحد مشترك بين جميع الفئات ديالك.',
              )}
            </p>
            <button
              type="button"
              disabled={locked || items.length >= rights.maxProducts}
              className="secondary"
              onClick={() => {
                const id = crypto.randomUUID();
                setExpandedItem(id);
                patch('services', [
                  ...items,
                  {
                    id,
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
                ]);
              }}
            >
              {t('Ajouter un produit ou service', 'إضافة منتج أو خدمة')}
            </button>
            {!items.length && (
              <p className="catalog-empty">
                {t(
                  'Commencez par un nom, une photo et un prix si vous le souhaitez.',
                  'بدا بالاسم وتصويرة والثمن إلا بغيتي.',
                )}
              </p>
            )}
            {items.map((item, i) => (
              <article className="catalog-product-editor" key={item.id}>
                <div className="catalog-product-row">
                  <button
                    type="button"
                    className="catalog-product-open"
                    disabled={locked}
                    aria-expanded={expandedItem === item.id}
                    aria-controls={'product-edit-' + item.id}
                    onClick={() => setExpandedItem(expandedItem === item.id ? '' : item.id)}
                  >
                    {item.image ? (
                      <img src={item.thumbnail || item.image} alt="" loading="lazy" />
                    ) : (
                      <span className="catalog-product-placeholder" aria-hidden="true">
                        ▧
                      </span>
                    )}
                    <span>
                      <strong>
                        {!item.nameFr && !item.nameAr
                          ? t('Nouveau produit ou service', 'منتج أو خدمة جديدة')
                          : catalogText(item.nameFr, item.nameAr, ar)}
                      </strong>
                      <small>
                        {cataloguePrice(item.price, ar) || t('Prix non affiché', 'الثمن ما باينش')}{' '}
                        ·{' '}
                        {item.availability === 'hidden'
                          ? t('Masqué', 'مخفي')
                          : item.availability === 'soldout'
                            ? t('Épuisé', 'نفد')
                            : t('Disponible', 'متوفر')}
                      </small>
                    </span>
                    <span className="catalog-edit-label">{t('Modifier', 'تعديل')}</span>
                  </button>
                  <details className="catalog-item-menu">
                    <summary aria-label={t('Actions sur cet article', 'إجراءات المنتج')}>⋯</summary>
                    <div>
                      {moves('services', i, items.length)}
                      <button
                        type="button"
                        disabled={locked || items.length >= rights.maxProducts}
                        onClick={() => {
                          const id = crypto.randomUUID();
                          patch('services', [...items, { ...item, id }]);
                          setExpandedItem(id);
                        }}
                      >
                        {t('Dupliquer', 'نسخ')}
                      </button>
                      <button
                        type="button"
                        disabled={locked}
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
                  </details>
                </div>
                {expandedItem === item.id && (
                  <div className="catalog-product-form" id={'product-edit-' + item.id}>
                    {input(
                      t('Nom du produit ou service *', 'اسم المنتج أو الخدمة *'),
                      language === 'Fr' ? item.nameFr : item.nameAr,
                      (v) => updateItem(item.id, language === 'Fr' ? 'nameFr' : 'nameAr', v),
                      {
                        maxLength: 120,
                        lang: language.toLowerCase(),
                        dir: language === 'Ar' ? 'rtl' : 'ltr',
                      },
                    )}
                    <ItemCategoryField
                      data={data}
                      setData={setData}
                      itemId={item.id}
                      language={language}
                      ar={ar}
                      disabled={locked}
                    />
                    <h4>{t('Image principale', 'الصورة الرئيسية')}</h4>
                    {media(
                      item.image,
                      (v) => updateItem(item.id, 'image', v),
                      false,
                      (v) => updateItem(item.id, 'thumbnail', v),
                    )}
                    {input(
                      t('Prix en dirhams (facultatif)', 'الثمن بالدرهم (اختياري)'),
                      item.price,
                      (v) => updateItem(item.id, 'price', v),
                      { inputMode: 'decimal', maxLength: 30 },
                    )}
                    <details className="catalog-options">
                      <summary>{t('Plus d’options', 'اختيارات إضافية')}</summary>
                      <label className="field">
                        {t('Description (facultative)', 'الوصف (اختياري)')}
                        <textarea
                          lang={language.toLowerCase()}
                          dir={language === 'Ar' ? 'rtl' : 'ltr'}
                          maxLength={800}
                          value={language === 'Fr' ? item.description : item.descriptionAr}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              language === 'Fr' ? 'description' : 'descriptionAr',
                              e.target.value,
                            )
                          }
                        />
                      </label>
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
                      <details className="catalog-options">
                        <summary>
                          {t(
                            'Galerie, référence et réduction sur cet article',
                            'الصور والمرجع والتخفيض على هاد المنتج',
                          )}
                        </summary>
                        <div className="form-grid">
                          {input(
                            t('Référence', 'المرجع'),
                            item.reference,
                            (v) => updateItem(item.id, 'reference', v),
                            { maxLength: 80 },
                          )}
                          {input(
                            t('Ancien prix (facultatif)', 'الثمن القديم (اختياري)'),
                            item.oldPrice,
                            (v) => updateItem(item.id, 'oldPrice', v),
                            { inputMode: 'decimal', maxLength: 30 },
                          )}
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
                    </details>
                    <button type="button" className="secondary" onClick={() => setExpandedItem('')}>
                      {t('Fermer la fiche', 'سد التفاصيل')}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </fieldset>
        )}
      </div>
      <details className="catalog-options catalog-settings">
        <summary>{t('Réglages du catalogue', 'إعدادات الكاتالوگ')}</summary>
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

        <p className="hint">
          {t(
            `Stockage partagé avec votre carte : ${rights.storageMB} Mo, ${rights.maxFiles} fichiers maximum.`,
            `التخزين مشترك مع البطاقة: ${rights.storageMB} ميغابايت و${rights.maxFiles} ملف كحد أقصى.`,
          )}
        </p>
      </details>

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
