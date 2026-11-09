'use client';
import { useId } from 'react';
import {
  singleActionTypes,
  singleActionMetaMap,
  isSingleActionValid,
  formatSingleActionHref,
  type SingleActionConfig,
  type SingleActionType,
} from './lib/single-action';
import {
  Star,
  MessageCircle,
  Phone,
  Globe,
  MapPin,
  Calendar,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { socialIconPaths } from './lib/social-icons';

function SocialSvg({ name, size = 20 }: { name: string; size?: number }) {
  const paths = socialIconPaths[name] || [];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function SingleActionIcon({ type, size = 20 }: { type: SingleActionType; size?: number }) {
  switch (type) {
    case 'google_review':
      return <Star size={size} />;
    case 'whatsapp':
      return <MessageCircle size={size} />;
    case 'call':
      return <Phone size={size} />;
    case 'website':
      return <Globe size={size} />;
    case 'facebook':
      return <SocialSvg name="facebook" size={size} />;
    case 'instagram':
      return <SocialSvg name="instagram" size={size} />;
    case 'tiktok':
      return <SocialSvg name="tiktok" size={size} />;
    case 'linkedin':
      return <SocialSvg name="linkedin" size={size} />;
    case 'youtube':
      return <SocialSvg name="youtube" size={size} />;
    case 'maps':
      return <MapPin size={size} />;
    case 'booking':
      return <Calendar size={size} />;
    case 'menu':
      return <BookOpen size={size} />;
    case 'custom':
    default:
      return <ExternalLink size={size} />;
  }
}

export default function SingleActionEditor({
  data,
  setData,
  ar,
  busy = false,
}: {
  data: any;
  setData: (fnOrObj: any) => void;
  ar: boolean;
  busy?: boolean;
}) {
  const t = (fr: string, a: string) => (ar ? a : fr);
  const helpId = useId();

  const current: SingleActionConfig = data.singleAction || {
    enabled: false,
    type: 'google_review',
    value: '',
    message: '',
    labelFr: '',
    labelAr: '',
  };

  const selectedType: SingleActionType = singleActionTypes.includes(current.type)
    ? current.type
    : 'google_review';

  const meta = singleActionMetaMap[selectedType] || singleActionMetaMap.google_review;
  const isValid = !current.value || isSingleActionValid(selectedType, current.value);

  const update = (patch: Partial<SingleActionConfig>) => {
    setData((prev: any) => ({
      ...prev,
      singleAction: {
        ...(prev.singleAction || {
          enabled: false,
          type: 'google_review',
          value: '',
          message: '',
          labelFr: '',
          labelAr: '',
        }),
        ...patch,
      },
    }));
  };

  // Preview label calculation
  let previewLabel = ar ? meta.defaultLabelAr : meta.defaultLabelFr;
  if (selectedType === 'custom') {
    if (ar && current.labelAr?.trim()) previewLabel = current.labelAr.trim();
    else if (!ar && current.labelFr?.trim()) previewLabel = current.labelFr.trim();
    else if (current.labelFr?.trim()) previewLabel = current.labelFr.trim();
    else if (current.labelAr?.trim()) previewLabel = current.labelAr.trim();
  }

  const btnBg = data.buttonColor || data.color || '#ff9125';
  const btnRadius =
    data.buttonShape === 'pill' ? '999px' : data.buttonShape === 'square' ? '0px' : '12px';

  return (
    <section className="panel single-action-panel">
      <div className="panel-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={22} style={{ color: 'var(--brand-accent)' }} />
          <h2>{t('Action unique personnalisable', 'الإجراء الموحد القابل للتخصيص')}</h2>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            disabled={busy}
            checked={current.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
          />
          <span>{t('Activer sur cette carte', 'تفعيل على هذه البطاقة')}</span>
        </label>
      </div>

      <p className="hint">
        {t(
          'Permet de concentrer votre carte sur un seul objectif prioritaire (ex. récolter des avis Google, recevoir des messages WhatsApp ou des appels). Lorsqu’elle est active, cette action remplace les boutons multiples par un seul bouton principal mis en avant.',
          'تتيح لك تركيز بطاقتك على هدف رئيسي واحد (مثل جمع تقييمات Google، تلقي رسائل واتساب أو اتصالات مباشرة). عند تفعيلها، يستبدل هذا الخيار الأزرار المتعددة بزر رئيسي وحيد وواضح.',
        )}
      </p>

      {current.enabled && (
        <div className="single-action-content">
          <fieldset disabled={busy} className="single-action-type-fieldset">
            <legend>{t('1. Choisissez votre action principale', '1. اختر الإجراء الرئيسي')}</legend>
            <div className="single-action-grid">
              {singleActionTypes.map((typeKey) => {
                const itemMeta = singleActionMetaMap[typeKey];
                const isSelected = selectedType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    className={'single-action-choice' + (isSelected ? ' selected' : '')}
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (typeKey !== selectedType) {
                        update({
                          type: typeKey,
                          value: '', // clear old value on change
                        });
                      }
                    }}
                  >
                    <SingleActionIcon type={typeKey} size={22} />
                    <strong>{ar ? itemMeta.titleAr : itemMeta.titleFr}</strong>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset disabled={busy} className="single-action-config-fieldset">
            <legend>{t(`2. Configurer : ${meta.titleFr}`, `2. إعداد: ${meta.titleAr}`)}</legend>

            <label className="field">
              <span>
                {selectedType === 'call'
                  ? t('Numéro de téléphone direct', 'رقم الهاتف المباشر')
                  : selectedType === 'whatsapp'
                    ? t('Numéro WhatsApp (avec indicatif)', 'رقم واتساب (مع الرمز الدولي)')
                    : t('Lien ou URL de destination', 'الرابط أو عنوان URL')}
              </span>
              <input
                type={selectedType === 'call' ? 'tel' : 'text'}
                dir="ltr"
                value={current.value}
                placeholder={ar ? meta.placeholderAr : meta.placeholderFr}
                onChange={(e) => update({ value: e.target.value })}
                aria-describedby={helpId}
              />
            </label>

            <p id={helpId} className="hint" style={{ marginTop: '-4px' }}>
              {ar ? meta.helperAr : meta.helperFr}
            </p>

            {current.value && !isValid && (
              <div className="single-action-error-badge" role="alert">
                <AlertCircle size={16} />
                <span>
                  {t(
                    'Format non valide. Vérifiez l’adresse URL ou le numéro saisi.',
                    'تنسيق غير صالح. يرجى التحقق من الرابط أو رقم الهاتف.',
                  )}
                </span>
              </div>
            )}

            {current.value && isValid && (
              <div className="single-action-success-badge">
                <CheckCircle2 size={16} />
                <span>{t('Action validée et prête', 'تم التحقق من الرابط بنجاح')}</span>
              </div>
            )}

            {selectedType === 'whatsapp' && (
              <label className="field" style={{ marginTop: '14px' }}>
                <span>{t('Message prérempli (facultatif)', 'رسالة تمهيدية مسبقة (اختياري)')}</span>
                <textarea
                  rows={2}
                  value={current.message || ''}
                  placeholder={t(
                    'Ex. Bonjour, je vous contacte depuis votre carte SoraLink.',
                    'مثال: مرحباً، أتواصل معك من خلال بطاقتك SoraLink.',
                  )}
                  onChange={(e) => update({ message: e.target.value })}
                />
              </label>
            )}

            {selectedType === 'custom' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                  marginTop: '14px',
                }}
              >
                <label className="field">
                  <span>{t('Intitulé du bouton (Français)', 'نص الزر (بالفرنسية)')}</span>
                  <input
                    type="text"
                    value={current.labelFr || ''}
                    placeholder="Ex. Découvrir notre offre"
                    onChange={(e) => update({ labelFr: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>{t('Intitulé du bouton (Arabe)', 'نص الزر (بالعربية)')}</span>
                  <input
                    type="text"
                    dir="rtl"
                    value={current.labelAr || ''}
                    placeholder="مثال: اكتشف عرضنا الخاص"
                    onChange={(e) => update({ labelAr: e.target.value })}
                  />
                </label>
              </div>
            )}
          </fieldset>

          {/* Live Preview */}
          <div className="single-action-preview-section">
            <span className="single-action-preview-title">
              {t('Aperçu du bouton unique sur votre carte :', 'معاينة الزر الموحد على بطاقتك:')}
            </span>
            <div className="single-action-preview-box">
              <div
                className="card-single-action-demo-btn"
                style={{
                  backgroundColor: btnBg,
                  borderRadius: btnRadius,
                }}
              >
                <SingleActionIcon type={selectedType} size={20} />
                <span>{previewLabel}</span>
              </div>
            </div>
            {current.value && isValid && (
              <span className="single-action-target-preview">
                {t('Cible du lien : ', 'وجهة الرابط: ')}
                <code>{formatSingleActionHref(selectedType, current.value, current.message)}</code>
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
