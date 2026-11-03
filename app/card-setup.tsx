'use client';
import ProfileIdentityFields from './profile-identity-fields';
import { profileName, profileKind } from './lib/profile-identity';
import { useState, useRef, useEffect } from 'react';
import CardStylePicker from './card-style-picker';
import { ContactActionsEditor } from './contact-editors';
import type { DashboardContext } from './dashboard-editor';
export default function CardSetup({
  context,
  onExit,
}: {
  context: DashboardContext;
  onExit: () => void;
}) {
  const { data, setData, busy, t, ar, startCrop, published, setPublished, id, setTab } = context;
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const labels = [
    t('Style', 'الستايل'),
    t('Identité', 'الهوية'),
    t('Contact', 'التواصل'),
    t('Vérifier', 'المراجعة'),
  ];
  return (
    <section className="panel card-setup" dir={ar ? 'rtl' : 'ltr'}>
      <div className="setup-heading">
        <div>
          <span className="eyebrow">{t('Création guidée', 'صايب الكارط خطوة بخطوة')}</span>
          <h2>{t('Votre carte, simplement', 'الكارط ديالك بسهولة')}</h2>
        </div>
        <button type="button" className="text-button" disabled={busy} onClick={onExit}>
          {t('Passer à la gestion', 'مرّ لتسيير الكارط')}
        </button>
      </div>
      <ol className="setup-steps" aria-label={t('Étapes de création', 'خطوات إنشاء الكارط')}>
        {labels.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              disabled={busy || (i > 1 && !profileName(data))}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>
      <div className="setup-step-content" key={step}>
        <h3 ref={heading} tabIndex={-1}>
          {t('Étape ', 'الخطوة ')}
          {step + 1} / 4 · {labels[step]}
        </h3>
        {step === 0 && (
          <>
            <CardStylePicker data={data} setData={setData} ar={ar} busy={busy} />
            <div className="form-grid">
              {(['avatar', 'cover'] as const).map((key) => (
                <label className="field" key={key}>
                  {key === 'avatar'
                    ? t(
                        'Votre logo ou portrait (facultatif)',
                        'اللوگو ولا التصويرة ديالك (اختياري)',
                      )
                    : t('Votre couverture (facultative)', 'تصويرة الغلاف (اختيارية)')}
                  <input
                    type="file"
                    disabled={busy}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      e.currentTarget.value = '';
                      if (file) startCrop(file, key);
                    }}
                  />
                  {data[key] && (
                    <span className="setup-image-controls">
                      <img
                        className="setup-image-preview"
                        src={data[key]}
                        alt={t('Image choisie', 'التصويرة المختارة')}
                      />
                      <button
                        type="button"
                        className="text-button"
                        disabled={busy}
                        onClick={() => setData((d: any) => ({ ...d, [key]: '' }))}
                      >
                        {key === 'avatar'
                          ? t('Retirer le logo ou portrait', 'حيّد اللوگو ولا التصويرة')
                          : t('Retirer la couverture', 'حيّد الغلاف')}
                      </button>
                    </span>
                  )}
                </label>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <fieldset disabled={busy}>
            <legend>{t('Présentez votre activité', 'عرّف بالنشاط ديالك')}</legend>
            <ProfileIdentityFields data={data} setData={setData} ar={ar} busy={busy} />
            <label className="field">
              {t('Présentation courte', 'تقديم قصير')}
              <textarea
                maxLength={800}
                value={data.bio || ''}
                onChange={(e) => {
                  const bio = e.target.value;
                  setData((d: any) => ({ ...d, bio }));
                }}
              />
            </label>
            <p className="hint">
              {t(
                'Renseignez le nom à mettre en avant. Les autres informations peuvent être complétées ensuite.',
                'عمّر الاسم اللي بغيتي يبان هو الأول. المعلومات الأخرى تقدر تزيدها من بعد.',
              )}
            </p>
          </fieldset>
        )}
        {step === 2 && <ContactActionsEditor context={context} />}
        {step === 3 && (
          <fieldset disabled={busy}>
            <legend>{t('Vérifiez votre carte dans l’aperçu', 'راجع الكارط فالمعاينة')}</legend>
            <p>
              {t(
                'Votre style, votre identité et vos actions sont prêts. L’enregistrement est automatique. Choisissez si votre carte est visible publiquement.',
                'الستايل والمعلومات وأزرار التواصل واجدين. التسجيل تلقائي. اختار واش الكارط تبان للعموم.',
              )}
            </p>
            <dl className="setup-summary">
              <dt>
                {profileKind(data) === 'business' ? t('Établissement', 'المحل') : t('Nom', 'الاسم')}
              </dt>
              <dd>{profileName(data)}</dd>
              <dt>
                {profileKind(data) === 'business'
                  ? t('Contact', 'المسؤول')
                  : t('Entreprise', 'المقاولة')}
              </dt>
              <dd>
                {(profileKind(data) === 'business' ? data.name : data.business) ||
                  t('Non renseigné', 'ما تعمّرش')}
              </dd>
            </dl>
            <label className="toggle">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              {t('Carte visible publiquement', 'الكارط باينة للعموم')}
            </label>
            <button
              type="button"
              className="primary full"
              disabled={busy || !profileName(data)}
              onClick={onExit}
            >
              {t('Terminer', 'كمّل')}
            </button>

            <p className="hint">
              {t(
                'Les produits, réseaux et rendez-vous se complètent ensuite depuis les rubriques de votre espace.',
                'المنتجات ومواقع التواصل والمواعيد تقدر تزيدهم من بعد من أقسام الحساب ديالك.',
              )}
            </p>
            {id && (
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => {
                  onExit();
                  setTab('share');
                }}
              >
                {t('Ouvrir le partage et le QR', 'فتح المشاركة ورمز QR')}
              </button>
            )}
          </fieldset>
        )}
      </div>
      <div className="setup-navigation">
        <button
          className="secondary"
          type="button"
          disabled={busy || step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          {t('Précédent', 'السابق')}
        </button>
        {step < 3 && (
          <button
            type="button"
            className="primary"
            disabled={busy || (step === 1 && !profileName(data))}
            onClick={() => setStep((s) => s + 1)}
          >
            {t('Continuer', 'كمّل')}
          </button>
        )}
      </div>
      <p className="hint">
        {t(
          'Les modifications sont enregistrées automatiquement. Vous choisissez la visibilité de votre carte.',
          'التغييرات كيتسجلو تلقائياً. نتا كتختار واش الكارط تبان للعموم.',
        )}
      </p>
    </section>
  );
}
