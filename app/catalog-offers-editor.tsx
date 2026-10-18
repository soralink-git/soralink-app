'use client';
import { useRef, useState } from 'react';
import { Plus, Camera, Video } from 'lucide-react';
import type { DashboardContext } from './dashboard-editor';
import { MAX_PROMOTIONS, promotionStatus } from './lib/promotions';
import { catalogRights } from './lib/catalog-menu';
import { compressPhoto } from './lib/compress-photo';
import { mediaError, VIDEO_TYPES } from './lib/content-media';
import CatalogMediaEditor from './catalog-media-editor';
import CatalogVideos from './catalog-videos';
import { PhotoPreview } from './photo-gallery';
import ImageCropper from './image-cropper';
export default function CatalogOffersEditor({ context }: { context: DashboardContext }) {
  const { data, setData, ar, t, busy, setCatalogWorking, setMsg } = context;
  const rights = catalogRights(context.subscription);
  const [opened, setOpened] = useState('');
  const [title, setTitle] = useState('');
  const [working, setWorking] = useState(false);
  const [crop, setCrop] = useState<{ source: File | string; id: string } | null>(null);
  const importing = useRef(false);
  const locked = busy || working;
  const update = (id: string, key: string, value: unknown) =>
    setData((d: any) => ({
      ...d,
      promotions: d.promotions.map((p: any) => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  async function upload(file: File, id: string, video = false) {
    if (importing.current || busy) return;
    importing.current = true;
    setWorking(true);
    setCatalogWorking?.(true);
    try {
      if (video && !VIDEO_TYPES.includes(file.type))
        throw Error(t('Choisissez une vidéo MP4, WebM ou MOV.', 'اختار فيديو MP4، WebM ولا MOV.'));
      const prepared = video ? file : await compressPhoto(file);
      const error = mediaError(prepared.type, prepared.size);
      if (error) throw Error(ar ? 'راجع نوع الملف والحجم: الفيديو حتى 50 ميغابايت.' : error);
      const form = new FormData();
      form.set('file', prepared);
      form.set('purpose', 'catalog-offer');
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const body: any = await r.json();
      if (!r.ok) throw Error(ar ? body.errorAr || 'تعذر الاستيراد.' : body.error);
      update(id, video ? 'recordedVideo' : 'image', body.url);
      setMsg(
        t(
          'Média ajouté à l’offre. Enregistrement automatique en cours.',
          'تزاد الملف للعرض. التسجيل التلقائي خدام.',
        ),
      );
      setCrop(null);
    } catch (e: any) {
      setMsg(
        ar && !/[\u0600-\u06ff]/.test(e.message)
          ? 'تعذر الاستيراد. راجع الاتصال وعاود جرّب.'
          : e.message,
      );
    } finally {
      importing.current = false;
      setWorking(false);
      setCatalogWorking?.(false);
    }
  }
  const input = (p: any, key: string, label: string, type = 'text') => (
    <label className="field">
      {label}
      <input
        type={type}
        maxLength={type === 'date' ? undefined : 120}
        inputMode={/Price/.test(key) ? 'decimal' : undefined}
        value={p[key] || ''}
        onChange={(e) => update(p.id, key, e.target.value)}
      />
    </label>
  );
  const labels: Record<string, [string, string]> = {
    active: ['Visible', 'باين'],
    inactive: ['Masquée', 'مخفي'],
    scheduled: ['Programmée', 'مبرمج'],
    expired: ['Terminée', 'سالا'],
    draft: ['À compléter', 'خاصو يتكمّل'],
  };
  return (
    <section className="catalog-promotions-editor">
      <h3>{t('Offres et promotions', 'العروض والتخفيضات')}</h3>
      <p className="hint">
        {t(
          'Présentez une offre avec sa photo ou sa vidéo. Elle apparaît uniquement pendant sa période de validité si elle est activée.',
          'قدّم العرض بالتصويرة ولا الفيديو ديالو. كيبان غير إلا كان مفعّل وفالفترة المحددة.',
        )}
      </p>
      <fieldset disabled={locked || !rights.enabled}>
        <legend>{t('Ajouter une offre', 'زيد عرض')}</legend>
        <label className="field">
          {t('Titre de votre offre', 'عنوان العرض')}
          <input
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Ex. Pack cartes de visite', 'مثال: عرض بطائق الزيارة')}
          />
        </label>
        <button
          type="button"
          className="secondary"
          disabled={!title.trim() || data.promotions.length >= MAX_PROMOTIONS}
          onClick={() => {
            const id = crypto.randomUUID();
            setData((d: any) => ({
              ...d,
              promotions: [
                ...d.promotions,
                {
                  id,
                  title: title.trim(),
                  description: '',
                  image: '',
                  images: [],
                  video: '',
                  recordedVideo: '',
                  regularPrice: '',
                  promoPrice: '',
                  startDate: '',
                  endDate: '',
                  enabled: false,
                },
              ],
            }));
            setOpened(id);
            setTitle('');
          }}
        >
          <Plus size={16} />
          {t('Ajouter une offre', 'زيد عرض')} ({data.promotions.length}/{MAX_PROMOTIONS})
        </button>
        {!data.promotions.length && (
          <p className="catalog-empty">
            {t(
              'Créez une offre pour y associer vos photos et vidéos.',
              'صايب عرض باش تزيد ليه التصاور والفيديوهات.',
            )}
          </p>
        )}
        {data.promotions.map((p: any) => (
          <article className="promotion-editor" key={p.id}>
            <div className="catalog-product-row">
              <button
                type="button"
                className="catalog-product-open"
                aria-expanded={opened === p.id}
                aria-controls={'offer-edit-' + p.id}
                onClick={() => setOpened(opened === p.id ? '' : p.id)}
              >
                {p.image ? (
                  <img src={p.image} alt="" loading="lazy" />
                ) : (
                  <span className="catalog-product-placeholder" aria-hidden="true">
                    ▧
                  </span>
                )}
                <span>
                  <strong>{p.title || t('Offre à compléter', 'عرض خاصو يتكمّل')}</strong>
                  <small>{t(...labels[promotionStatus(p)])}</small>
                </span>
                <span className="catalog-edit-label">{t('Modifier', 'تعديل')}</span>
              </button>
              <details className="catalog-item-menu">
                <summary aria-label={t('Actions sur cette offre', 'إجراءات العرض')}>⋯</summary>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('Supprimer cette offre ?', 'واش تحذف هاد العرض؟')))
                      setData((d: any) => ({
                        ...d,
                        promotions: d.promotions.filter((o: any) => o.id !== p.id),
                      }));
                  }}
                >
                  {t('Supprimer', 'حذف')}
                </button>
              </details>
            </div>
            {opened === p.id && (
              <div className="catalog-product-form" id={'offer-edit-' + p.id}>
                {input(p, 'title', t('Titre *', 'العنوان *'))}
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => update(p.id, 'enabled', e.target.checked)}
                  />
                  {t('Afficher cette offre', 'إظهار هاد العرض')}
                </label>
                <details className="catalog-options">
                  <summary>{t('Photos et vidéo de l’offre', 'تصاور وفيديو العرض')}</summary>
                  {p.image && (
                    <div className="promotion-photo">
                      <PhotoPreview src={p.image} alt={p.title} ar={ar} />
                      <button type="button" onClick={() => setCrop({ source: p.image, id: p.id })}>
                        {t('Recadrer', 'تأطير')}
                      </button>
                      <button type="button" onClick={() => update(p.id, 'image', '')}>
                        {t('Retirer la photo', 'حيّد التصويرة')}
                      </button>
                    </div>
                  )}
                  <label className="field">
                    {t('Photo principale', 'التصويرة الرئيسية')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        if (file) setCrop({ source: file, id: p.id });
                      }}
                    />
                  </label>
                  <label className="field">
                    <Camera size={16} />
                    {t('Prendre une photo pour cette offre', 'خد تصويرة لهاد العرض')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        if (file) setCrop({ source: file, id: p.id });
                      }}
                    />
                  </label>
                  {(p.images || []).map((src: string) => (
                    <div className="promotion-photo" key={src}>
                      <PhotoPreview src={src} alt={p.title} ar={ar} />
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            p.id,
                            'images',
                            p.images.filter((v: string) => v !== src),
                          )
                        }
                      >
                        {t('Retirer la photo', 'حيّد التصويرة')}
                      </button>
                    </div>
                  ))}
                  <CatalogVideos
                    data={p}
                    ar={ar}
                    title={t('Vidéo de cette offre', 'فيديو هاد العرض')}
                  />
                  <label className="field">
                    {t('Importer une vidéo · 50 Mo maximum', 'زيد فيديو · حتى 50 ميغابايت')}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        if (file) void upload(file, p.id, true);
                      }}
                    />
                  </label>
                  <label className="field">
                    <Video size={16} />
                    {t('Filmer cette offre', 'صوّر هاد العرض')}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        if (file) void upload(file, p.id, true);
                      }}
                    />
                  </label>
                  {!!p.recordedVideo && (
                    <button type="button" onClick={() => update(p.id, 'recordedVideo', '')}>
                      {t('Retirer la vidéo', 'حيّد الفيديو')}
                    </button>
                  )}
                  {input(
                    p,
                    'video',
                    t(
                      'Lien YouTube de cette offre (facultatif)',
                      'رابط YouTube لهاد العرض (اختياري)',
                    ),
                    'url',
                  )}
                  {!!p.video && (
                    <button type="button" onClick={() => update(p.id, 'video', '')}>
                      {t('Retirer le lien YouTube', 'حيّد رابط YouTube')}
                    </button>
                  )}
                </details>
                <details className="catalog-options">
                  <summary>{t('Description, prix et dates', 'الوصف والأثمنة والتواريخ')}</summary>
                  <label className="field">
                    {t('Description', 'الوصف')}
                    <textarea
                      maxLength={800}
                      value={p.description}
                      onChange={(e) => update(p.id, 'description', e.target.value)}
                    />
                  </label>
                  <div className="form-grid">
                    {input(p, 'regularPrice', t('Prix habituel (DH)', 'الثمن العادي (درهم)'))}
                    {input(p, 'promoPrice', t('Prix de l’offre (DH)', 'ثمن العرض (درهم)'))}
                    {input(p, 'startDate', t('Début (facultatif)', 'البداية (اختياري)'), 'date')}
                    {input(
                      p,
                      'endDate',
                      t('Fin incluse (facultative)', 'النهاية داخلة فالعرض (اختياري)'),
                      'date',
                    )}
                  </div>
                  <p className="hint">
                    {t('Les dates suivent l’heure du Maroc.', 'التواريخ بتوقيت المغرب.')}
                  </p>
                </details>
                <button type="button" className="secondary" onClick={() => setOpened('')}>
                  {t('Fermer la fiche', 'سد التفاصيل')}
                </button>
              </div>
            )}
          </article>
        ))}
        <CatalogMediaEditor context={context} />
      </fieldset>
      {crop && (
        <ImageCropper
          source={crop.source}
          target="product"
          ar={ar}
          circle={false}
          onCancel={() => setCrop(null)}
          onApply={(f) => upload(f, crop.id)}
        />
      )}
    </section>
  );
}
