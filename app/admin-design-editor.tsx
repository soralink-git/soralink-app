'use client';
import { useEffect, useRef, useState } from 'react';
import { capabilities } from './lib/offers';
import CardView from './card-view';
import Customization from './card-customization';
import BackgroundEditor from './background-editor';
import ImageCropper from './image-cropper';
import { designSettings, sectionLabels, visibleDesignSections } from './lib/card-design';
import { appearance } from './lib/personalization';
import { MAX_SOURCE_PHOTO_BYTES } from './lib/compress-photo';
export default function AdminDesignEditor({
  profile,
  ar,
  onSaved,
  onClose,
  onDirtyChange,
}: {
  profile: any;
  ar: boolean;
  onSaved: (result: { data: any; revision: string }) => void;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const [data, setData] = useState<any>(() => JSON.parse(profile.data));
  const [revision, setRevision] = useState(profile.updated);
  const [tab, setTab] = useState('sections');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [crop, setCrop] = useState<{ source: File | string; previous: string } | null>(null);
  const original = useRef<File | string | undefined>(undefined);
  useEffect(() => {
    setData(JSON.parse(profile.data));
    setRevision(profile.updated);
  }, [profile.id, profile.updated]);
  const baseline = JSON.parse(profile.data);
  const dirty =
    JSON.stringify({ ...designSettings(data), defaultLanguage: data.defaultLanguage }) !==
    JSON.stringify({ ...designSettings(baseline), defaultLanguage: baseline.defaultLanguage });
  useEffect(() => {
    onDirtyChange?.(dirty || !!crop);
  }, [dirty, crop, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  async function save() {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'design',
          id: profile.id,
          revision,
          settings: {
            ...designSettings(data),
            ...(data.defaultLanguage ? { defaultLanguage: data.defaultLanguage } : {}),
          },
        }),
      });
      const result: any = await response.json();
      if (!response.ok)
        throw Error(
          ar
            ? result.errorAr || 'ما تسجّلوش الإعدادات. عاود جرّب.'
            : result.error || 'Enregistrement impossible.',
        );
      setData(result.data);
      setRevision(result.revision);
      onSaved(result);
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function close() {
    if (
      dirty &&
      !confirm(t('Fermer sans enregistrer ces réglages ?', 'تسدّ بلا ما تسجّل هاد الإعدادات؟'))
    )
      return;
    onClose();
  }
  const sections = visibleDesignSections(data),
    a = appearance(data);
  return (
    <section
      className="panel admin-design-editor"
      dir={ar ? 'rtl' : 'ltr'}
      aria-label={t('Présentation et sections de la carte', 'المظهر وأقسام الكارط')}
    >
      <div className="panel-title">
        <div>
          <h2>{t('Présentation et sections', 'المظهر والأقسام')}</h2>
          <p>{data.name}</p>
        </div>
        <button type="button" className="secondary small" disabled={busy || !!crop} onClick={close}>
          {t('Fermer', 'سدّ')}
        </button>
      </div>
      <p className="hint">
        {t(
          'Réglages réservés à l’administration. Vérifiez l’aperçu, puis enregistrez pour appliquer à la carte du client.',
          'هاد الإعدادات خاصة بالإدارة. راجع المعاينة وسجّل باش تطبّق التغييرات على كارط الزبون.',
        )}
      </p>
      <div className="admin-design-layout">
        <div>
          <div
            className="row"
            role="group"
            aria-label={t('Réglages de présentation', 'إعدادات المظهر')}
          >
            {[
              ['sections', 'Sections', 'الأقسام'],
              ['appearance', 'Personnalisation avancée', 'التخصيص المفصّل'],
            ].map(([key, fr, da]) => (
              <button
                type="button"
                key={key}
                className={tab === key ? 'primary small' : 'secondary small'}
                aria-pressed={tab === key}
                disabled={busy || !!crop}
                onClick={() => setTab(key)}
              >
                {t(fr, da)}
              </button>
            ))}
          </div>
          <fieldset disabled={busy || !!crop} onChange={() => setSaved(false)}>
            {tab === 'sections' ? (
              <div>
                <p className="hint">
                  {t(
                    'L’identité reste en tête. Les sections vides restent masquées ; les photos et vidéos sont intégrées aux produits et services.',
                    'الهوية كتبقى فاللول. الأقسام الخاوية ما كتبانش، والتصاور والفيديوهات مجموعين مع المنتجات والخدمات.',
                  )}
                </p>
                {sections.map((key, index) => {
                  const locked = key === 'appointments' && !capabilities(profile).appointments;
                  return (
                    <div className="section-editor-row" key={key}>
                      <div className="section-control">
                        <label>
                          <input
                            type="checkbox"
                            disabled={locked}
                            checked={!locked && !a.hidden.includes(key)}
                            onChange={(e) =>
                              setData((old: any) => ({
                                ...old,
                                hiddenSections: e.target.checked
                                  ? a.hidden.filter((k: string) => k !== key)
                                  : [...a.hidden, key],
                              }))
                            }
                          />
                          {t(...sectionLabels[key])}
                        </label>
                        <label className="section-position">
                          {t('Position', 'الترتيب')}
                          <select
                            disabled={locked}
                            aria-label={t('Position de ', 'ترتيب ') + t(...sectionLabels[key])}
                            value={index}
                            onChange={(e) => {
                              const order = [...sections];
                              order.splice(index, 1);
                              order.splice(Number(e.target.value), 0, key);
                              setData((old: any) => ({
                                ...old,
                                sectionOrder: [
                                  ...order,
                                  ...a.order.filter((k: string) => !sections.includes(k)),
                                ],
                              }));
                            }}
                          >
                            {sections.map((_, i) => (
                              <option key={i} value={i}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {locked && (
                        <p className="hint">
                          {t('Option Rendez-vous requise', 'خاص خيار المواعيد')}
                        </p>
                      )}
                      <label className="field">
                        {t('Titre personnalisé · français', 'عنوان مخصّص · الدارجة')}
                        <input
                          disabled={locked}
                          maxLength={120}
                          value={data.sectionTitles?.[ar ? 'ar' : 'fr']?.[key] || ''}
                          placeholder={t(...sectionLabels[key])}
                          onChange={(e) => {
                            const value = e.target.value;
                            setData((old: any) => ({
                              ...old,
                              sectionTitles: {
                                ...old.sectionTitles,
                                [ar ? 'ar' : 'fr']: {
                                  ...old.sectionTitles?.[ar ? 'ar' : 'fr'],
                                  [key]: value,
                                },
                              },
                            }));
                          }}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <BackgroundEditor
                  data={data}
                  setData={setData}
                  ar={ar}
                  busy={busy}
                  autosave={false}
                  source={original.current}
                  startCrop={(source) => {
                    if (typeof source !== 'string') {
                      if (
                        !['image/jpeg', 'image/png', 'image/webp'].includes(source.type) ||
                        source.size > MAX_SOURCE_PHOTO_BYTES
                      ) {
                        setError(
                          t(
                            'Choisissez une image JPG, PNG ou WebP de 40 Mo maximum.',
                            'اختار تصويرة JPG ولا PNG ولا WebP ما تفوتش 40 ميغا.',
                          ),
                        );
                        return;
                      }
                      original.current = source;
                    }
                    setError('');
                    setCrop({ source, previous: data.backgroundPhoto || '' });
                  }}
                />
                <Customization data={data} setData={setData} ar={ar} t={t} />
              </>
            )}
          </fieldset>
        </div>
        <aside className="admin-design-preview">
          <strong>{t('Aperçu de la carte', 'معاينة الكارط')}</strong>
          <div inert>
            <CardView
              d={{ ...data, pro: !!capabilities(profile).appointments }}
              ar={ar}
              setAr={() => {}}
              onMessage={() => {}}
              onRequest={() => {}}
              preview
              withSections
            />
          </div>
        </aside>
      </div>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p role="status">{t('Réglages appliqués à la carte.', 'تطبّقو الإعدادات على الكارط.')}</p>
      )}
      <div className="admin-design-save">
        <button
          type="button"
          className="primary"
          disabled={busy || !!crop || !dirty}
          onClick={save}
        >
          {busy
            ? t('Enregistrement…', 'كيتسجّل…')
            : t('Enregistrer les réglages', 'سجّل الإعدادات')}
        </button>
      </div>
      {crop && (
        <ImageCropper
          source={crop.source}
          target="backgroundPhoto"
          circle={false}
          ar={ar}
          cardData={data}
          autosave={false}
          onLivePreview={(url) => setData((old: any) => ({ ...old, backgroundPhoto: url }))}
          onCancel={() => {
            setData((old: any) => ({ ...old, backgroundPhoto: crop.previous }));
            setCrop(null);
          }}
          onApply={async (file) => {
            const form = new FormData();
            form.set('file', file);
            form.set('profileId', profile.id);
            const response = await fetch('/api/upload', { method: 'POST', body: form });
            const result: any = await response.json();
            if (!response.ok)
              throw Error(
                ar
                  ? result.errorAr || 'ما ترفعاتش التصويرة.'
                  : result.error || 'Importation impossible.',
              );
            setData((old: any) => ({ ...old, backgroundPhoto: result.url }));
            setCrop(null);
            setSaved(false);
          }}
        />
      )}
    </section>
  );
}
