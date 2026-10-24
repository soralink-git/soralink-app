'use client';
import {
  cardStyles,
  cardPalettes,
  applyCardStyle,
  applyCardTheme,
  primaryColor,
  applyPrimaryColor,
} from './lib/card-styles';
import { useState, useEffect, useId, type Dispatch, type SetStateAction } from 'react';
import { BRAND } from './lib/brand';
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
  const selectedColor = primaryColor(data.buttonColor || data.color) || BRAND.orange;
  const customSelected = !cardPalettes.some((palette) => palette.color === selectedColor);
  const [customOpen, setCustomOpen] = useState(customSelected);
  const [hex, setHex] = useState(selectedColor);
  const [invalid, setInvalid] = useState(false);
  const errorId = useId();
  useEffect(() => {
    setHex(selectedColor);
    setInvalid(false);
  }, [selectedColor]);
  const apply = (value: string) => {
    const color = primaryColor(value);
    if (color) setData((d: any) => applyPrimaryColor(d, color));
  };
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
            aria-pressed={selectedColor === palette.color}
            onClick={() => {
              setHex(palette.color);
              setInvalid(false);
              setCustomOpen(false);
              apply(palette.color);
            }}
          >
            <span style={{ background: palette.color }} aria-hidden="true" />
            {ar ? palette.ar : palette.fr}
          </button>
        ))}
      </div>
      <details
        className="custom-main-color"
        open={customOpen}
        onToggle={(event) => setCustomOpen(event.currentTarget.open)}
      >
        <summary>
          {t('Couleur personnalisée', 'لون من اختيارك')}
          {customSelected ? t(' · Sélectionnée', ' · مختار') : ''}
        </summary>
        <div className="main-color-inputs">
          <label className="field">
            {t('Choisir une couleur', 'اختار اللون')}
            <input
              type="color"
              value={selectedColor}
              onChange={(event) => {
                const color = event.target.value;
                setHex(color);
                setInvalid(false);
                apply(color);
              }}
            />
          </label>
          <label className="field">
            {t('Code couleur', 'كود اللون')}
            <input
              type="text"
              value={hex}
              maxLength={7}
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              placeholder="#FF9125"
              aria-invalid={invalid}
              aria-describedby={invalid ? errorId : undefined}
              onChange={(event) => {
                const value = event.target.value;
                setHex(value);
                setInvalid(false);
                apply(value);
              }}
              onBlur={() => {
                const color = primaryColor(hex);
                setInvalid(!color);
                if (color) setHex(color);
              }}
            />
          </label>
        </div>
        {invalid && (
          <p id={errorId} role="alert">
            {t(
              'Saisissez 6 caractères de 0 à 9 ou de A à F, par exemple #FF9125.',
              'دخل 6 رموز من 0 حتى 9 ولا من A حتى F، مثلاً #FF9125.',
            )}
          </p>
        )}
        <p className="hint">
          {t(
            'La couleur s’applique immédiatement à l’aperçu et s’enregistre automatiquement.',
            'اللون كيبان مباشرة فالمعاينة وكيتسجّل تلقائياً.',
          )}
        </p>
      </details>
    </fieldset>
  );
}
