'use client';
import { accentText } from './card-helpers';
import { useEffect, useRef, useState } from 'react';
import { normalizeCatalogue, cataloguePrice, type CatalogueItem } from './lib/catalogue';
import {
  catalogDocuments,
  catalogSettings,
  catalogCategories,
  catalogText,
  visibleProducts,
  documentContentPath,
} from './lib/catalog-menu';
import { whatsappNumber } from './lib/whatsapp-notification';
import { todayMorocco } from './lib/promotions';
import { modalHistory } from './lib/modal-history';
import PdfCatalogue from './pdf-catalogue';
import PhotoGallery, { PhotoPreview } from './photo-gallery';
export function CatalogDocuments({
  data,
  id,
  ar,
  preview = false,
}: {
  data: any;
  id: string;
  ar: boolean;
  preview?: boolean;
}) {
  const [opened, setOpened] = useState('');
  const t = (fr: string, a: string) => (ar ? a : fr),
    docs = catalogDocuments(data, preview).filter((d) => d.visible),
    settings = catalogSettings(data);
  if (!settings.enabled || !settings.pdf || !docs.length) return null;
  return (
    <div className="catalog-documents">
      <h2>{t('Produits et services', 'المنتجات والخدمات')}</h2>
      {docs.map((d, i) => {
        const title =
          d.titleFr || d.titleAr
            ? catalogText(d.titleFr, d.titleAr, ar)
            : t('Document', 'وثيقة') + ' ' + (i + 1);
        const description = catalogText(d.descriptionFr, d.descriptionAr, ar, true);
        const src = preview || !id ? d.src : documentContentPath(id, d.id);
        return (
          <article className="catalog-document" key={d.id}>
            {d.cover && <PhotoPreview src={d.cover} alt={title} ar={ar} />}
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            <button
              type="button"
              className="secondary full"
              aria-expanded={opened === d.id}
              onClick={() => setOpened(opened === d.id ? '' : d.id)}
            >
              {opened === d.id
                ? t('Fermer le document', 'إغلاق الوثيقة')
                : t('Lire le document', 'قراءة الوثيقة')}
            </button>
            {opened === d.id && <PdfCatalogue src={src} ar={ar} />}{' '}
            {d.allowDownload && !preview && id && (
              <a className="secondary" href={src + '?download=1'} download>
                {t('Télécharger le PDF', 'تحميل الوثيقة')}
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}
export default function CatalogProducts({
  data,
  ar,
  preview = false,
  id,
  onRequest,
  onMessage,
}: {
  data: any;
  ar: boolean;
  preview?: boolean;
  id: string;
  onRequest: (kind: string, item?: any) => void;
  onMessage: (s: string) => void;
}) {
  const t = (fr: string, a: string) => (ar ? a : fr),
    settings = catalogSettings(data),
    cats = catalogCategories(data).filter((c) => c.visible),
    items = visibleProducts({
      ...data,
      services: normalizeCatalogue(data.services, false, preview),
    }) as CatalogueItem[];
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState(''),
    [limit, setLimit] = useState(12),
    [cart, setCart] = useState<Record<string, number>>({}),
    [detail, setDetail] = useState(''),
    [ordering, setOrdering] = useState(false);
  const selected = items.filter((p) => cart[p.id] && p.availability === 'available');
  const name = (p: CatalogueItem) => catalogText(p.nameFr, p.nameAr, ar);
  const itemCategory = (p: CatalogueItem) => {
    const c = cats.find((c) => c.id === p.categoryId);
    return c
      ? catalogText(c.nameFr, c.nameAr, ar)
      : p.category || p.categoryAr
        ? catalogText(p.category, p.categoryAr, ar)
        : '';
  };
  const filtered = items.filter(
    (p) =>
      (!category || (p.categoryId || p.category) === category) &&
      (!search || name(p).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())),
  );
  const legacyCategories = [
    ...new Set(items.filter((p) => !p.categoryId && p.category).map((p) => p.category)),
  ];
  const current = items.find((p) => p.id === detail);
  const phone = whatsappNumber(data.whatsapp || '');
  const canOrder = settings.whatsapp && !!phone;
  function choose(p: CatalogueItem) {
    if (preview) {
      onMessage(
        t(
          'Aperçu : la demande sera disponible sur la carte publiée.',
          'معاينة: الطلب غادي يكون متوفر فالصفحة المنشورة.',
        ),
      );
      return;
    }
    setDetail('');
    if (data.activity === false) {
      void send([{ id: p.id, quantity: 1 }]);
      return;
    }
    onRequest(p.type === 'product' ? 'commande' : 'devis', {
      ...p,
      name: name(p),
      category: itemCategory(p),
      description: catalogText(p.description, p.descriptionAr, ar, true),
    });
  }
  async function send(itemsToSend = selected.map((p) => ({ id: p.id, quantity: cart[p.id] }))) {
    if (preview) {
      onMessage(t('Aperçu : l’envoi WhatsApp est désactivé.', 'معاينة: إرسال واتساب غير مفعّل.'));
      return;
    }
    if (ordering) return;
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setOrdering(true);
    try {
      const r = await fetch('/api/catalog-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: id,
          language: ar ? 'ar' : 'fr',
          items: itemsToSend,
        }),
      });
      const b: any = await r.json();
      if (!r.ok) throw Error(ar ? b.errorAr || 'تعذر الإرسال.' : b.error);
      if (popup) popup.location.href = b.url;
      else window.location.assign(b.url);
    } catch (e: any) {
      popup?.close();
      onMessage(
        ar && !/[\u0600-\u06ff]/.test(e.message || '')
          ? 'تعذر الإرسال. راجع الاتصال وعاود جرّب.'
          : e.name === 'TypeError'
            ? 'Envoi impossible. Vérifiez votre connexion et réessayez.'
            : e.message,
      );
    } finally {
      setOrdering(false);
    }
  }
  const promo = (p: CatalogueItem) =>
    p.promotion &&
    (!p.promoStart || p.promoStart <= todayMorocco()) &&
    (!p.promoEnd || p.promoEnd >= todayMorocco());
  const price = (p: CatalogueItem) =>
    settings.showPrices && (p.price || p.oldPrice) ? (
      <div className="promotion-prices">
        {p.oldPrice && p.price && promo(p) && <del>{cataloguePrice(p.oldPrice, ar)}</del>}
        {p.price && <strong className="catalogue-price">{cataloguePrice(p.price, ar)}</strong>}
      </div>
    ) : null;
  const actions = (p: CatalogueItem) => (
    <>
      <span className="catalog-stock">
        {p.availability === 'soldout' ? t('Épuisé', 'نفد') : t('Disponible', 'متوفر')}
      </span>
      {p.availability === 'available' && (data.activity !== false || canOrder) && (
        <>
          <button className="secondary full" type="button" onClick={() => choose(p)}>
            {p.type === 'service'
              ? t('Demander un devis', 'طلب عرض ثمن')
              : t('Commander / Demander', 'طلب المنتج')}
          </button>
          {canOrder && (
            <label className="field">
              {t('Quantité à sélectionner', 'الكمية المختارة')}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                disabled={ordering || (!cart[p.id] && selected.length >= 40)}
                value={cart[p.id] || 0}
                onChange={(e) =>
                  setCart((c) => ({
                    ...c,
                    [p.id]: Math.min(99, Math.max(0, Math.floor(Number(e.target.value) || 0))),
                  }))
                }
              />
            </label>
          )}
        </>
      )}
    </>
  );
  if (!settings.enabled || !settings.products || !items.length) return null;
  return (
    <div
      className={
        'catalog-interactive catalog-layout-' +
        settings.layout +
        (settings.accent ? ' has-catalog-accent' : '')
      }
      dir={ar ? 'rtl' : 'ltr'}
      style={
        settings.accent
          ? ({
              '--catalog-accent': settings.accent,
              '--button-bg': settings.accent,
              '--button-text': accentText(settings.accent),
              '--accent': settings.accent,
              '--accent-text': accentText(settings.accent),
              '--catalog-accent-text': accentText(settings.accent),
            } as React.CSSProperties)
          : undefined
      }
    >
      <div className="catalog-filters">
        <label className="field">
          {t('Rechercher un article', 'البحث عن منتج')}
          <input
            type="search"
            value={search}
            maxLength={120}
            onChange={(e) => {
              setSearch(e.target.value);
              setLimit(12);
            }}
          />
        </label>
        <label className="field">
          {t('Catégorie', 'الفئة')}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setLimit(12);
            }}
          >
            <option value="">{t('Toutes les catégories', 'جميع الفئات')}</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {catalogText(c.nameFr, c.nameAr, ar)}
              </option>
            ))}
            {legacyCategories.map((c) => (
              <option key={c} value={c}>
                {ar ? catalogText('', items.find((p) => p.category === c)?.categoryAr, ar) : c}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalogue-grid">
        {filtered.slice(0, limit).map((p) => (
          <article className="catalogue-item" key={p.id}>
            {p.image && (
              <PhotoPreview src={p.image} thumbnail={p.thumbnail} alt={name(p)} ar={ar} />
            )}
            <div>
              <span className="catalogue-kind">
                {p.type === 'product' ? t('Produit', 'منتج') : t('Service', 'خدمة')}
              </span>
              {promo(p) && <span className="promotion-label">{t('Promotion', 'تخفيض')}</span>}
              <h3>{name(p)}</h3>
              {itemCategory(p) && <small>{itemCategory(p)}</small>}
              {price(p)}
              <button className="secondary full" type="button" onClick={() => setDetail(p.id)}>
                {t('Voir les détails', 'عرض التفاصيل')}
              </button>
              {actions(p)}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && <p role="status">{t('Aucun article trouvé.', 'ما لقينا حتى منتج.')}</p>}
      {filtered.length > limit && (
        <button type="button" className="secondary full" onClick={() => setLimit((n) => n + 12)}>
          {t('Afficher plus d’articles', 'عرض المزيد من المنتجات')} (
          {Math.min(limit, filtered.length)}/{filtered.length})
        </button>
      )}
      {canOrder && selected.length > 0 && (
        <aside className="catalog-cart" aria-label={t('Votre sélection', 'الاختيار ديالك')}>
          <h3>{t('Votre sélection', 'الاختيار ديالك')}</h3>
          <ul>
            {selected.map((p) => (
              <li key={p.id}>
                {cart[p.id]} × {name(p)}{' '}
                <button
                  type="button"
                  aria-label={t('Retirer ', 'حذف ') + name(p)}
                  onClick={() => setCart((c) => ({ ...c, [p.id]: 0 }))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="primary full"
            disabled={ordering}
            onClick={() => void send()}
          >
            {t('Envoyer ma sélection sur WhatsApp', 'إرسال الاختيار عبر واتساب')}
          </button>
          <button type="button" className="secondary full" onClick={() => setCart({})}>
            {t('Vider la sélection', 'مسح الاختيار')}
          </button>
        </aside>
      )}
      {current && (
        <ProductDetail ar={ar} title={name(current)} onClose={() => setDetail('')}>
          <PhotoGallery photos={[current.image, ...current.images].filter(Boolean)} ar={ar} />
          <p>{catalogText(current.description, current.descriptionAr, ar, true)}</p>
          {current.reference && (
            <p>
              {t('Référence : ', 'المرجع: ')}
              {current.reference}
            </p>
          )}
          {price(current)}
          {actions(current)}
        </ProductDetail>
      )}
    </div>
  );
}
function ProductDetail({
  ar,
  title,
  onClose,
  children,
}: {
  ar: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(() => {}),
    callback = useRef(onClose);
  callback.current = onClose;
  useEffect(() => {
    const el = ref.current!,
      previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    const history = modalHistory(() => callback.current());
    close.current = history.close;
    document.body.style.overflow = 'hidden';
    el.showModal();
    return () => {
      history.dispose();
      el.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      dir={ar ? 'rtl' : 'ltr'}
      className="catalog-product-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
    >
      <div className="panel-title">
        <h2>{title}</h2>
        <button
          type="button"
          autoFocus
          onClick={() => close.current()}
          aria-label={ar ? 'إغلاق' : 'Fermer'}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
