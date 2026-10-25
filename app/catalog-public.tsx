'use client';
import { matchesCatalogSearch } from './lib/catalog-search';
import StickyCardBar from './sticky-card-bar';
import {
  selectionKey,
  canAddSelection,
  MAX_CATALOG_SELECTIONS,
  selectedProduct,
  selectionTotal,
  fulfillmentLabels,
  type Selection,
} from './lib/catalog-order';
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
  const closeDocument = useRef<() => void>(() => {});
  const t = (fr: string, a: string) => (ar ? a : fr),
    docs = catalogDocuments(data, preview).filter((d) => d.visible),
    settings = catalogSettings(data);
  const documentOpen = settings.enabled && settings.pdf && docs.some((d) => d.id === opened);
  useEffect(() => {
    if (!documentOpen) return;
    const navigation = modalHistory(() => setOpened(''));
    closeDocument.current = navigation.close;
    return () => {
      closeDocument.current = () => {};
      navigation.dispose();
    };
  }, [documentOpen]);
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
              onClick={() => {
                if (opened === d.id) closeDocument.current();
                else setOpened(d.id);
              }}
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
    [ordering, setOrdering] = useState(false),
    [chosenVariants, setChosenVariants] = useState<Record<string, string>>({}),
    [fulfillment, setFulfillment] = useState(''),
    [deliveryAddress, setDeliveryAddress] = useState(''),
    [customerName, setCustomerName] = useState(''),
    [customerPhone, setCustomerPhone] = useState('');
  const intentRef = useRef({ signature: '', id: '' });
  const selected = Object.entries(cart).flatMap(([key, quantity]) => {
    if (!quantity) return [];
    try {
      const [id, variantId] = JSON.parse(key);
      const p = items.find((p) => p.id === id);
      if (!p) return [];
      return [
        {
          key,
          id,
          variantId: variantId || undefined,
          quantity,
          product: selectedProduct(p, variantId || undefined),
        },
      ];
    } catch {
      return [];
    }
  });
  const variantId = (p: CatalogueItem) =>
    p.variants.find((v) => v.id === chosenVariants[p.id] && v.availability === 'available')?.id ||
    p.variants.find((v) => v.availability === 'available')?.id ||
    '';
  const selectedPrice = (p: CatalogueItem) => {
    try {
      return selectedProduct(p, variantId(p) || undefined);
    } catch {
      return p;
    }
  };
  const total = settings.showPrices ? selectionTotal(selected) : null;
  const cartId = 'catalog-cart-' + (id || 'preview');
  const mode = settings.fulfillmentModes.includes(fulfillment as any)
    ? fulfillment
    : settings.fulfillmentModes[0] || '';
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
      matchesCatalogSearch(p, search, ar),
  );
  const legacyCategories = [
    ...new Set(items.filter((p) => !p.categoryId && p.category).map((p) => p.category)),
  ];
  const current = items.find((p) => p.id === detail);
  const detailDescription = current
    ? catalogText(current.description, current.descriptionAr, ar, true).trim()
    : '';
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
    if (ordering) return;
    if (canOrder && (data.activity === false || settings.fulfillmentModes.length)) {
      const key = selectionKey(p.id, variantId(p));
      if (
        !canAddSelection(
          selected.map((line) => line.key),
          key,
        )
      ) {
        onMessage(
          t(
            `Votre sélection est limitée à ${MAX_CATALOG_SELECTIONS} articles ou variantes.`,
            `الاختيار محدود فـ ${MAX_CATALOG_SELECTIONS} منتج ولا نوع.`,
          ),
        );
        return;
      }
      setDetail('');
      setCart((c) => ({ ...c, [key]: c[key] || 1 }));
      setTimeout(
        () =>
          document.getElementById(cartId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        0,
      );
      return;
    }
    setDetail('');
    onRequest(p.type === 'product' ? 'commande' : 'devis', {
      ...selectedPrice(p),
      variantId: variantId(p) || undefined,
      name: name(p),
      category: itemCategory(p),
      description: catalogText(p.description, p.descriptionAr, ar, true),
    });
  }
  async function send(
    itemsToSend: Selection[] = selected.map(({ id, quantity, variantId }) => ({
      id,
      quantity,
      variantId,
    })),
  ) {
    if (preview) {
      onMessage(t('Aperçu : l’envoi WhatsApp est désactivé.', 'معاينة: إرسال واتساب غير مفعّل.'));
      return;
    }
    if (ordering) return;
    if (mode === 'delivery' && !deliveryAddress.trim()) {
      onMessage(t('Renseignez l’adresse de livraison.', 'دخل عنوان التوصيل.'));
      return;
    }
    const payload = {
      profile: id,
      language: ar ? 'ar' : 'fr',
      items: itemsToSend,
      fulfillment: mode,
      address: mode === 'delivery' ? deliveryAddress : '',
      name: customerName,
      phone: customerPhone,
    };
    const signature = JSON.stringify(payload);
    if (intentRef.current.signature !== signature)
      intentRef.current = { signature, id: crypto.randomUUID() };
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setOrdering(true);
    try {
      const r = await fetch('/api/catalog-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, intentId: intentRef.current.id }),
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
  const price = (item: CatalogueItem) => {
    const p = selectedPrice(item);
    return settings.showPrices && (p.price || p.oldPrice) ? (
      <div className="promotion-prices">
        {!p.variants.some((v) => v.id === variantId(p) && v.price) &&
          p.oldPrice &&
          p.price &&
          promo(p) && <del>{cataloguePrice(p.oldPrice, ar)}</del>}
        {p.price && <strong className="catalogue-price">{cataloguePrice(p.price, ar)}</strong>}
      </div>
    ) : null;
  };
  const actions = (p: CatalogueItem) => (
    <>
      {p.variants.length > 0 && (
        <label className="field">
          {t('Choisir une variante', 'اختار النوع')}
          <select
            value={variantId(p)}
            disabled={ordering}
            onChange={(e) => setChosenVariants((v) => ({ ...v, [p.id]: e.target.value }))}
          >
            {!p.variants.some((v) => v.availability === 'available') && (
              <option value="">
                {t('Aucune variante disponible', 'ما كاين حتى اختيار متوفر')}
              </option>
            )}
            {p.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.availability === 'soldout'}>
                {catalogText(v.nameFr, v.nameAr, ar)}
                {v.availability === 'soldout' ? t(' · épuisé', ' · نفد') : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      <span className="catalog-stock">
        {p.availability === 'soldout' ? t('Épuisé', 'نفد') : t('Disponible', 'متوفر')}
      </span>
      {p.availability === 'available' &&
        (!p.variants.length || !!variantId(p)) &&
        (data.activity !== false || canOrder) && (
          <>
            <button
              className="secondary full"
              type="button"
              disabled={ordering}
              onClick={() => choose(p)}
            >
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
                  disabled={
                    ordering ||
                    (!cart[selectionKey(p.id, variantId(p))] &&
                      selected.length >= MAX_CATALOG_SELECTIONS)
                  }
                  value={cart[selectionKey(p.id, variantId(p))] || 0}
                  onChange={(e) =>
                    setCart((c) => ({
                      ...c,
                      [selectionKey(p.id, variantId(p))]: Math.min(
                        99,
                        Math.max(0, Math.floor(Number(e.target.value) || 0)),
                      ),
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
        <aside
          id={cartId}
          className="catalog-cart"
          aria-label={t('Votre sélection', 'الاختيار ديالك')}
        >
          <h3>{t('Votre sélection', 'الاختيار ديالك')}</h3>
          <ul>
            {selected.map(({ key, product: p, quantity, variantId }) => (
              <li key={key}>
                {quantity} × {name(p)}
                {variantId
                  ? ' · ' +
                    catalogText(
                      p.variants.find((v) => v.id === variantId)?.nameFr,
                      p.variants.find((v) => v.id === variantId)?.nameAr,
                      ar,
                    )
                  : ''}{' '}
                <button
                  type="button"
                  aria-label={t('Retirer ', 'حذف ') + name(p)}
                  disabled={ordering}
                  onClick={() => setCart((c) => ({ ...c, [key]: 0 }))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="catalog-total">
            {total === null
              ? t(
                  'Total à confirmer / articles sur devis',
                  'المجموع خاصو التأكيد / أثمنة حسب الطلب',
                )
              : t('Total indicatif : ', 'المجموع التقريبي: ') + cataloguePrice(String(total), ar)}
          </p>
          {settings.fulfillmentModes.length > 0 && (
            <label className="field">
              {t('Mode de retrait ou livraison', 'طريقة التسليم')}
              <select
                disabled={ordering}
                value={mode}
                onChange={(e) => setFulfillment(e.target.value)}
              >
                {settings.fulfillmentModes.map((v) => (
                  <option key={v} value={v}>
                    {fulfillmentLabels[v][ar ? 1 : 0]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {mode === 'delivery' && (
            <label className="field">
              {t('Adresse de livraison', 'عنوان التوصيل')}
              <textarea
                maxLength={300}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={ordering}
              />
              <small>
                {t(
                  'Frais de livraison à confirmer avec le professionnel.',
                  'مصاريف التوصيل خاص تأكدها مع المهني.',
                )}
              </small>
            </label>
          )}
          <details className="catalog-options">
            <summary>
              {t('Ajouter mes coordonnées (facultatif)', 'نزيد معلومات التواصل ديالي (اختياري)')}
            </summary>
            <label className="field">
              {t('Votre nom', 'الاسم ديالك')}
              <input
                maxLength={120}
                autoComplete="name"
                disabled={ordering}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
            <label className="field">
              {t('Votre téléphone', 'التلفون ديالك')}
              <input
                maxLength={40}
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                disabled={ordering}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
            <small>
              {t(
                'Ces coordonnées servent uniquement à traiter cette demande.',
                'هاد المعلومات كتستعمل غير لمعالجة هاد الطلب.',
              )}
            </small>
          </details>
          <p className="hint">
            {t(
              'WhatsApp va s’ouvrir. Envoyez ensuite le message pour transmettre votre demande.',
              'غادي يتحل WhatsApp. من بعد صيفط الرسالة باش توصل الطلب ديالك.',
            )}
          </p>
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
      {canOrder && selected.length > 0 && !current && (
        <>
          <div className="catalog-mobile-spacer" />
          <StickyCardBar
            ar={ar}
            count={selected.reduce((n, row) => n + row.quantity, 0)}
            total={
              total === null
                ? t('Total à confirmer', 'المجموع خاصو التأكيد')
                : t('Total indicatif : ', 'المجموع التقريبي: ') + cataloguePrice(String(total), ar)
            }
            target={cartId}
            accent={settings.accent || data.buttonColor || data.color || '#ff9125'}
            foreground={accentText(settings.accent || data.buttonColor || data.color || '#ff9125')}
          />
        </>
      )}
      {current && (
        <ProductDetail ar={ar} title={name(current)} onClose={() => setDetail('')}>
          <PhotoGallery photos={[current.image, ...current.images].filter(Boolean)} ar={ar} />
          {detailDescription && <p>{detailDescription}</p>}
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
