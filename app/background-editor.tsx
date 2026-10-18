'use client';
import { appearance } from './lib/personalization';
import type { CropTarget } from './lib/crop-geometry';
export default function BackgroundEditor({
  data,
  setData,
  startCrop,
  source,
  busy,
  ar,
  autosave = true,
}: {
  data: any;
  setData: (updater: (previous: any) => any) => void;
  startCrop: (source: File | string, target: CropTarget) => void;
  source?: File | string;
  busy: boolean;
  ar: boolean;
  autosave?: boolean;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const a = appearance(data);
  return (
    <div className="background-editor">
      <h3>{t('Photo de fond', 'تصويرة الخلفية')}</h3>
      <label className="field">
        {t('Choisir une photo à recadrer', 'اختار تصويرة باش تقصّها')}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) startCrop(file, 'backgroundPhoto');
          }}
        />
      </label>
      {a.backgroundPhoto && (
        <>
          <img
            className="background-editor-thumbnail"
            src={a.backgroundPhoto}
            alt={t('Photo de fond actuelle', 'تصويرة الخلفية الحالية')}
          />
          <div className="row">
            <button
              type="button"
              className="secondary small"
              disabled={busy}
              onClick={() => startCrop(source || data.backgroundPhoto, 'backgroundPhoto')}
            >
              {t('Recadrer le fond', 'قصّ الخلفية')}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => setData((previous) => ({ ...previous, backgroundPhoto: '' }))}
            >
              {t('Retirer la photo', 'حيّد التصويرة')}
            </button>
          </div>
          <label className="field">
            {t('Opacité de la photo', 'وضوح التصويرة')} : {a.backgroundOpacity} %
            <input
              type="range"
              dir="ltr"
              min="0"
              max="100"
              step="1"
              disabled={busy}
              value={a.backgroundOpacity}
              onChange={(event) =>
                setData((previous) => ({
                  ...previous,
                  backgroundOpacity: Number(event.target.value),
                }))
              }
            />
          </label>
          <p className="hint">
            {t(
              '0 % : photo masquée. 100 % : photo entièrement visible. Le texte et les boutons gardent leur opacité.',
              '0 %: التصويرة مخبّية. 100 %: التصويرة باينة كاملة. الكتابة والأزرار كيبقاو بنفس الوضوح.',
            )}
          </p>
        </>
      )}
      <p className="hint">
        {t(
          autosave ? 'Le fond et son opacité sont enregistrés automatiquement.' : 'Enregistrez les réglages pour publier le fond et son opacité.',
          autosave ? 'الخلفية والوضوح ديالها كيتسجلو تلقائياً.' : 'سجّل الإعدادات باش تنشر الخلفية والوضوح ديالها.',
        )}
      </p>
    </div>
  );
}
