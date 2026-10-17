'use client';
import { Camera, Video, X } from 'lucide-react';
import { recordedVideoUrl } from './lib/content-media';
import { catalogRights } from './lib/catalog-menu';
import { appearance } from './lib/personalization';
import type { DashboardContext } from './dashboard-editor';
export default function CatalogMediaEditor({ context }: { context: DashboardContext }) {
  const {
    data,
    setData,
    ar,
    t,
    busy,
    storage,
    subscription,
    photoCaptureRef,
    videoCaptureRef,
    uploadPhotos,
    uploadVideo,
    uploadProgress,
    field,
  } = context;
  const limits = catalogRights(subscription);
  return (
    <section className="catalog-media-editor-panel">
      <h3>{t('Photos et vidéos', 'الصور والفيديوهات')}</h3>

      <div className="camera-actions">
        <button
          className="secondary"
          disabled={busy || data.photos.length >= 10}
          onClick={() => photoCaptureRef.current?.click()}
        >
          <Camera size={18} />
          {t('Prendre une photo', 'خد تصويرة')}
        </button>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => videoCaptureRef.current?.click()}
        >
          <Video size={18} />
          {t('Filmer une vidéo', 'صوّر فيديو')}
        </button>
        <input
          hidden
          ref={photoCaptureRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void uploadPhotos([file]);
          }}
        />
        <input
          hidden
          ref={videoCaptureRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void uploadVideo(file);
          }}
        />
      </div>
      <p className="hint">
        {t(
          'Ajoutez des photos de votre activité ou une vidéo. Enregistrez ensuite pour les publier.',
          'زيد تصاور ديال الخدمة أو فيديو. ومن بعد سجّل باش يبانو فالبطاقة.',
        )}
      </p>
      <div className="form-grid">
        <label className="field">
          {t('Galerie · 10 photos maximum', 'الگالوري · حتى 10 تصاور')}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || data.photos.length >= 10}
            onChange={(e) => {
              const files = Array.from(e.currentTarget.files || []);
              e.currentTarget.value = '';
              void uploadPhotos(files);
            }}
          />
          <span className="hint">
            {uploadProgress
              ? t(
                  'Importation : ' + uploadProgress.done + '/' + uploadProgress.total,
                  'كنزيدو التصاور : ' + uploadProgress.done + '/' + uploadProgress.total,
                )
              : t(
                  'Sélectionnez plusieurs photos · JPG, PNG, WebP · 10 Mo par photo · ' +
                    data.photos.length +
                    '/10 utilisées',
                  'اختار تصاور بزاف · JPG، PNG، WebP · 10 Mo لكل تصويرة · ' +
                    data.photos.length +
                    '/10 مستعملين',
                )}
          </span>
        </label>
        <label className="field">
          {t('Vidéo enregistrée · 1 vidéo, maximum 50 Mo', 'فيديو مسجّل · فيديو واحد، حتى 50 Mo')}
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={busy}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              if (file) void uploadVideo(file);
            }}
          />
          <span className="hint">
            {t(
              'Une nouvelle vidéo remplace la vidéo actuelle sur votre carte après enregistrement.',
              'الفيديو الجديد كيبدّل الفيديو الحالي فالـكارط من بعد التسجيل.',
            )}
          </span>
        </label>
        <div>
          {field('video', t('Lien YouTube', 'رابط YouTube'), 'url')}
          {!!data.video && (
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => setData((d: any) => ({ ...d, video: '' }))}
            >
              {t('Retirer le lien YouTube', 'حيّد رابط YouTube')}
            </button>
          )}
        </div>
      </div>
      {recordedVideoUrl(data.recordedVideo) && (
        <div className="recorded-video-preview">
          <video
            className="content-video"
            src={data.recordedVideo}
            controls
            playsInline
            preload="metadata"
            aria-label={t('Aperçu de la vidéo', 'معاينة الفيديو')}
          />
          <button
            className="secondary small"
            disabled={busy}
            onClick={() => setData({ ...data, recordedVideo: '' })}
          >
            {t('Retirer la vidéo', 'حيّد الفيديو')}
          </button>
        </div>
      )}
      <div className="gallery">
        {data.photos.map((p: string, i: number) => (
          <div key={p}>
            <img src={p} alt={t('Photo ', 'صورة ') + (i + 1)} />
            <button
              onClick={() =>
                setData({
                  ...data,
                  photos: data.photos.filter((_: any, n: number) => i !== n),
                })
              }
              aria-label={t('Retirer la photo', 'حذف الصورة')}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <details className="catalog-options">
        <summary>{t('Visibilité, titres et stockage', 'الظهور والعناوين والتخزين')}</summary>
        {(['photos', 'video'] as const).map((key) => (
          <div key={key} className="catalog-media-visibility">
            <label className="toggle">
              <input
                type="checkbox"
                checked={!appearance(data).hidden.includes(key)}
                onChange={(e) => {
                  const visible = e.target.checked;
                  setData((d: any) => ({
                    ...d,
                    hiddenSections: visible
                      ? appearance(d).hidden.filter((k: string) => k !== key)
                      : [...appearance(d).hidden, key],
                  }));
                }}
              />
              {key === 'photos'
                ? t('Afficher les photos dans le catalogue', 'إظهار الصور فالكاتالوگ')
                : t('Afficher les vidéos dans le catalogue', 'إظهار الفيديوهات فالكاتالوگ')}
            </label>
            <label className="field">
              {t('Titre dans la langue actuelle', 'العنوان باللغة الحالية')}
              <input
                maxLength={120}
                value={data.sectionTitles?.[ar ? 'ar' : 'fr']?.[key] || ''}
                placeholder={
                  key === 'photos' ? t('En images', 'بالتصاور') : t('En vidéo', 'بالفيديو')
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setData((d: any) => ({
                    ...d,
                    sectionTitles: {
                      ...d.sectionTitles,
                      [ar ? 'ar' : 'fr']: { ...d.sectionTitles?.[ar ? 'ar' : 'fr'], [key]: value },
                    },
                  }));
                }}
              />
            </label>
          </div>
        ))}
        <div className="storage-summary">
          <strong>{t('Stockage du compte', 'التخزين ديال الحساب')}</strong>
          <p>
            {storage
              ? Math.ceil(storage.bytes / 1048576) +
                ' / ' +
                storage.limitBytes / 1048576 +
                t(' Mo · ', ' ميغابايت · ') +
                storage.files +
                ' / ' +
                storage.limitFiles +
                ' ' +
                t('fichiers', 'ملف')
              : t(
                  `${limits.storageMB} Mo maximum par compte · ${limits.maxFiles} fichiers`,
                  `حتى ${limits.storageMB} ميغابايت لكل حساب · ${limits.maxFiles} ملف`,
                )}
          </p>
          <p className="hint">
            {t(
              'Après enregistrement, les médias retirés sont supprimés s’ils ne sont plus utilisés sur une carte. Les imports abandonnés depuis plus de 24 h sont nettoyés lors d’une prochaine action.',
              'من بعد التسجيل، الملفات اللي حيّدتي كيتحيدو نهائياً إلا ما بقاوش مستعملين فشي كارط. الملفات اللي ترفعو وما تستعملوش كيتنقّاو من بعد 24 ساعة فإجراء جاي.',
            )}
          </p>
        </div>
      </details>
    </section>
  );
}
