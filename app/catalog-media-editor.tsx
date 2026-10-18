'use client';
import { useState } from 'react';
import type { DashboardContext } from './dashboard-editor';
import { associateLegacyMedia } from './lib/promotions';
export default function CatalogMediaEditor({ context }: { context: DashboardContext }) {
  const { data, setData, ar, t, busy, setMsg } = context;
  const [offer, setOffer] = useState('');
  const photos: string[] = data.photos || [];
  if (!photos.length && !data.recordedVideo && !data.video) return null;
  function attach(kind: 'photo' | 'video' | 'recordedVideo', value: string) {
    const next = associateLegacyMedia(data, offer, kind, value);
    if (!next) {
      setMsg(
        t(
          'Choisissez une offre avec une place disponible pour ce média.',
          'اختار عرض فيه بلاصة لهاد الملف.',
        ),
      );
      return;
    }
    setData(next);
  }
  function remove(kind: 'photo' | 'video' | 'recordedVideo', value: string) {
    if (window.confirm(t('Retirer cet ancien média ?', 'واش تحيّد هاد الملف القديم؟')))
      setData((d: any) =>
        kind === 'photo'
          ? { ...d, photos: d.photos.filter((src: string) => src !== value) }
          : { ...d, [kind]: '' },
      );
  }
  return (
    <details className="catalog-options catalog-legacy-media">
      <summary>
        {t('Anciens médias à associer à une offre', 'ملفات قديمة خاصها ترتابط بعرض')}
      </summary>
      <p className="hint">
        {t(
          'Ces médias sont conservés mais ne s’affichent plus seuls sur la carte. Associez-les à une offre pour les publier.',
          'هاد الملفات باقين محفوظين ولكن ما كيبانوش بوحدهم فالـكارط. ربطهم بعرض باش يبانوا.',
        )}
      </p>
      <label className="field">
        {t('Offre destinataire', 'العرض اللي غادي تزيد فيه الملف')}
        <select value={offer} onChange={(e) => setOffer(e.target.value)}>
          <option value="">{t('Choisir une offre', 'اختار عرض')}</option>
          {data.promotions.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.title || t('Offre à compléter', 'عرض خاصو يتكمّل')}
            </option>
          ))}
        </select>
      </label>
      {!data.promotions.length && (
        <p>{t('Créez d’abord une offre ci-dessus.', 'صايب الأول عرض من الفوق.')}</p>
      )}
      {photos.map((src) => (
        <div className="promotion-photo" key={src}>
          <img src={src} alt={t('Ancienne photo', 'تصويرة قديمة')} />
          <button type="button" disabled={busy || !offer} onClick={() => attach('photo', src)}>
            {t('Associer cette photo', 'ربط هاد التصويرة')}
          </button>
          <button type="button" disabled={busy} onClick={() => remove('photo', src)}>
            {t('Retirer', 'حذف')}
          </button>
        </div>
      ))}
      {(['recordedVideo', 'video'] as const).map(
        (key) =>
          data[key] && (
            <div key={key}>
              <p>
                {key === 'recordedVideo'
                  ? t('Ancienne vidéo importée', 'فيديو قديم مرفوع')
                  : t('Ancien lien YouTube', 'رابط YouTube قديم')}
              </p>
              <button
                type="button"
                disabled={busy || !offer}
                onClick={() => attach(key, data[key])}
              >
                {t('Associer à cette offre', 'ربط بهاد العرض')}
              </button>
              <button type="button" disabled={busy} onClick={() => remove(key, data[key])}>
                {t('Retirer', 'حذف')}
              </button>
            </div>
          ),
      )}
    </details>
  );
}
