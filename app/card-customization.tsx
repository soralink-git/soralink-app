'use client';
import { BRAND } from './lib/brand';
import { appearance } from './lib/personalization';
import { RotateCcw } from 'lucide-react';
export default function Customization({
  data = {},
  setData = () => {},
  ar = false,
  setAr = () => {},
  t = (fr: string) => fr,
}: {
  data?: any;
  setData?: (data: any) => void;
  ar?: boolean;
  setAr?: (ar: boolean) => void;
  t?: (fr: string, arText: string) => string;
} = {}) {
  const a = appearance(data);
  const select = (key: string, label: string, values: [string, string, string][]) => (
    <label className="field">
      {label}
      <select
        value={
          data[key] ||
          (
            {
              textSize: 'normal',
              buttonSize: 'normal',
              buttonStyle: 'filled',
              cardTheme: 'light',
              cardFont: 'modern',
              buttonShape: 'rounded',
              avatarShape: 'circle',
              defaultLanguage: ar ? 'ar' : 'fr',
            } as any
          )[key]
        }
        onChange={(e) => {
          const nextVal = e.target.value;
          if (key === 'defaultLanguage' && setAr) setAr(nextVal === 'ar');
          setData({ ...data, [key]: nextVal });
        }}
      >
        {values.map(([value, fr, arText]) => (
          <option key={value} value={value}>
            {t(fr, arText)}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="personalization">
      <h3>{t('Style de votre carte', 'ستايل الكارط ديالك')}</h3>
      <div className="form-grid">
        {select('defaultLanguage', t('Langue par défaut de la carte', 'اللغة الافتراضية للكارط'), [
          ['fr', 'Français', 'الفرنسية'],
          ['ar', 'العربية / الدارجة', 'العربية / الدارجة'],
        ])}
        {select('cardTheme', t('Thème général de la carte', 'المظهر العام للكارط'), [
          ['light', 'Clair moderne', 'فاتح عصري'],
          ['dark', 'Sombre élégant', 'داكن أنيق'],
          ['sand', 'Sable doré', 'رملي ذهبي'],
          ['teal', 'Émeraude', 'زمردي'],
        ])}
        {select('cardFont', t('Police', 'الخط'), [
          ['modern', 'Moderne', 'عصري'],
          ['classic', 'Classique', 'كلاسيكي'],
          ['simple', 'Simple', 'بسيط'],
        ])}
        {select('buttonShape', t('Forme des boutons', 'شكل الأزرار'), [
          ['rounded', 'Arrondis', 'مدوّرين'],
          ['square', 'Carrés', 'مربّعين'],
          ['pill', 'Très arrondis', 'مدوّرين بزاف'],
        ])}
        {select('avatarShape', t('Forme du portrait / logo', 'شكل التصويرة / اللوگو'), [
          ['circle', 'Rond', 'دائرة'],
          ['square', 'Carré arrondi', 'مربع مدوّر'],
        ])}
        {select('textSize', t('Taille du texte', 'حجم الكتابة'), [
          ['normal', 'Confortable', 'مريح'],
          ['large', 'Grande', 'كبيرة'],
          ['extra', 'Très grande', 'كبيرة بزاف'],
        ])}
        {select('buttonSize', t('Taille des boutons', 'حجم الأزرار'), [
          ['normal', 'Standard', 'عادي'],
          ['large', 'Grande', 'كبير'],
        ])}
        {select('buttonStyle', t('Style des boutons', 'ستايل الأزرار'), [
          ['filled', 'Plein', 'عامر'],
          ['outline', 'Contour', 'بالإطار'],
        ])}
        <label className="field">
          {t('Couleur du fond', 'لون الخلفية')}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="color"
              style={{
                flex: 1,
                minWidth: '48px',
                height: '46px',
                padding: '4px',
                cursor: 'pointer',
              }}
              value={
                a.fondColor ||
                (a.theme === 'dark'
                  ? '#0f172a'
                  : a.theme === 'sand'
                    ? '#f5b86e'
                    : a.theme === 'teal'
                      ? '#f0fdfa'
                      : '#e2c478')
              }
              onChange={(e) => setData({ ...data, fondColor: e.target.value })}
            />
            <input
              type="text"
              value={data.fondColor || ''}
              placeholder={
                a.theme === 'dark'
                  ? '#0F172A'
                  : a.theme === 'sand'
                    ? '#F5B86E'
                    : a.theme === 'teal'
                      ? '#F0FDFA'
                      : '#E2C478'
              }
              maxLength={7}
              style={{
                width: '96px',
                flexShrink: 0,
                minHeight: '46px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^#[0-9a-fA-F]{0,6}$/.test(val)) {
                  setData({ ...data, fondColor: val });
                }
              }}
            />
          </div>
        </label>
        <label className="field">
          {t('Couleur des blocs', 'لون الكتل')}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="color"
              style={{
                flex: 1,
                minWidth: '48px',
                height: '46px',
                padding: '4px',
                cursor: 'pointer',
              }}
              value={
                a.blockColor ||
                (a.theme === 'dark' ? '#151d28' : a.theme === 'teal' ? '#ffffff' : '#ffffff')
              }
              onChange={(e) => setData({ ...data, blockColor: e.target.value })}
            />
            <input
              type="text"
              value={data.blockColor || ''}
              placeholder={a.theme === 'dark' ? '#151D28' : '#FFFFFF'}
              maxLength={7}
              style={{
                width: '96px',
                flexShrink: 0,
                minHeight: '46px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^#[0-9a-fA-F]{0,6}$/.test(val)) {
                  setData({ ...data, blockColor: val });
                }
              }}
            />
          </div>
        </label>
        <label className="field">
          {t('Couleur des boutons', 'لون الأزرار')}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="color"
              style={{
                flex: 1,
                minWidth: '48px',
                height: '46px',
                padding: '4px',
                cursor: 'pointer',
              }}
              value={a.buttonColor || data.color || (a.theme === 'teal' ? '#00b5ad' : '#d5b66f')}
              onChange={(e) => setData({ ...data, buttonColor: e.target.value })}
            />
            <input
              type="text"
              value={data.buttonColor || ''}
              placeholder={a.theme === 'teal' ? '#00B5AD' : '#D5B66F'}
              maxLength={7}
              style={{
                width: '96px',
                flexShrink: 0,
                minHeight: '46px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^#[0-9a-fA-F]{0,6}$/.test(val)) {
                  setData({ ...data, buttonColor: val });
                }
              }}
            />
          </div>
        </label>
        <label className="field">
          {t('Couleur du texte', 'لون الكتابة')}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="color"
              style={{
                flex: 1,
                minWidth: '48px',
                height: '46px',
                padding: '4px',
                cursor: 'pointer',
              }}
              value={
                a.textColor ||
                (a.theme === 'dark'
                  ? '#f5f6f8'
                  : a.theme === 'sand'
                    ? '#352b20'
                    : a.theme === 'teal'
                      ? '#0f172a'
                      : '#1c2623')
              }
              onChange={(e) => setData({ ...data, textColor: e.target.value })}
            />
            <input
              type="text"
              value={data.textColor || ''}
              placeholder={
                a.theme === 'dark'
                  ? '#F5F6F8'
                  : a.theme === 'sand'
                    ? '#352B20'
                    : a.theme === 'teal'
                      ? '#0F172A'
                      : '#1C2623'
              }
              maxLength={7}
              style={{
                width: '96px',
                flexShrink: 0,
                minHeight: '46px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
              }}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^#[0-9a-fA-F]{0,6}$/.test(val)) {
                  setData({ ...data, textColor: val });
                }
              }}
            />
          </div>
        </label>
        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', opacity: 0.85 }}>
            {t('Palettes recommandées', 'ألوان مقترحة')}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              {
                label: t('Orange SoraLink', 'برتقالي SoraLink'),
                color: BRAND.orange,
                fond: BRAND.charcoal,
                theme: 'dark',
              },
              { label: 'Or Premium', color: '#d5b66f', fond: '#ffffff', theme: 'light' },
              { label: 'Bleu Nuit', color: '#4f46e5', fond: '#0f172a', theme: 'dark' },
              { label: 'Vert Émeraude', color: '#10b981', fond: '#ffffff', theme: 'light' },
              { label: 'Sable Chaud', color: '#b45309', fond: '#fff8ec', theme: 'sand' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                className="secondary small"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '20px',
                  padding: '5px 12px',
                }}
                onClick={() =>
                  setData({
                    ...data,
                    color: p.color,
                    buttonColor: p.color,
                    cardTheme: p.theme,
                    fondColor: p.fond,
                    blockColor: '',
                    textColor: '',
                  })
                }
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: p.color,
                    display: 'inline-block',
                  }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
          <button
            type="button"
            className="secondary small"
            onClick={() =>
              setData({
                ...data,
                color: BRAND.orange,
                cardTheme: 'light',
                fondColor: '',
                blockColor: '',
                buttonColor: '',
                textColor: '',
              })
            }
          >
            <RotateCcw size={15} />
            {t('Réinitialiser les couleurs par défaut', 'استعادة الألوان الافتراضية')}
          </button>
        </div>
      </div>
    </div>
  );
}
