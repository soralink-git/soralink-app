'use client';
import { cardStyles, cardPalettes, applyCardStyle, applyCardTheme } from './lib/card-styles';
import type { Dispatch, SetStateAction } from 'react';
import { appearance } from './lib/personalization';
export default function CardStylePicker({
  data,
  setData,
  ar,
  busy = false,
}: {
  data: any;
  setData: Dispatch<SetStateAction<any>>;
  ar: boolean;
  busy?: boolean;
}) {
  const t = (fr: string, a: string) => (ar ? a : fr);
  return (
    <fieldset className="card-style-picker" disabled={busy}>
      <legend>{t('Choisissez un point de départ', 'اختار الستايل اللي تبدا به')}</legend>
      <p className="hint">
        {t(
          'Chaque modèle reste personnalisable. Vos contenus et vos photos sont conservés.',
          'كل ستايل تقدر تبدّلو من بعد. المحتوى والتصاور ديالك كيبقاو.',
        )}
      </p>
      <div className="card-style-grid">
        {cardStyles.map((style) => {
          const selected = data.template === style.id;
          const sample = applyCardStyle(data, style.id);
          const custom = selected ? appearance(data) : null;
          return (
            <button
              key={style.id}
              type="button"
              className="card-style-choice"
              aria-pressed={data.template === style.id}
              onClick={() => setData((d: any) => applyCardStyle(d, style.id))}
            >
              <span
                className={'style-miniature style-miniature-' + style.id}
                style={
                  {
                    background: custom?.fondColor || sample.fondColor,
                    color: custom?.textColor || sample.textColor,
                    '--sample-accent':
                      custom?.buttonColor || (selected && data.color) || sample.buttonColor,
                  } as any
                }
                aria-hidden="true"
              >
                <span className="sample-banner" />
                <span className="sample-avatar" />
                <span className="sample-name" />
                <span className="sample-description" />
                <span className="sample-actions">
                  <i />
                  <i />
                  <i />
                </span>
              </span>
              <strong>{ar ? style.ar : style.fr}</strong>
              <span>{ar ? style.descriptionAr : style.descriptionFr}</span>
              {data.template === style.id && <small>{t('Sélectionné', 'مختار')}</small>}
            </button>
          );
        })}
      </div>
      <label className="field">
        {t('Ambiance', 'المظهر')}
        <select
          value={data.cardTheme === 'dark' ? 'dark' : 'light'}
          onChange={(e) => {
            const theme = e.target.value;
            setData((d: any) => applyCardTheme(d, theme));
          }}
        >
          <option value="light">{t('Claire', 'فاتح')}</option>
          <option value="dark">{t('Sombre', 'غامق')}</option>
        </select>
      </label>
      <h3>{t('Votre couleur principale', 'اللون الرئيسي ديالك')}</h3>
      <div
        className="card-palette-list"
        role="group"
        aria-label={t('Palettes de couleurs', 'اختيار الألوان')}
      >
        {cardPalettes.map((palette) => (
          <button
            key={palette.id}
            type="button"
            className="card-palette"
            aria-pressed={(data.buttonColor || data.color) === palette.color}
            onClick={() =>
              setData((d: any) => ({ ...d, color: palette.color, buttonColor: palette.color }))
            }
          >
            <span style={{ background: palette.color }} aria-hidden="true" />
            {ar ? palette.ar : palette.fr}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
