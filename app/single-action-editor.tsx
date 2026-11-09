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
  Phone,
  Globe,
  Calendar,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { socialIconPaths } from './lib/social-icons';

/**
 * Official Google "G" 4-color vector logo
 */
export function GoogleGLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

/**
 * Official Google Maps 4-color pin logo
 */
export function GoogleMapsLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path fill="#4285F4" d="M19.5 9.5c0-.8-.2-1.5-.4-2.2L12 14.8v4.7c3.8-1.5 7.5-6.1 7.5-10z" />
      <path
        fill="#34A853"
        d="M12 19.5v-4.7l-7.1-7.5C4.3 8 4 8.7 4 9.5c0 3.9 3.7 8.5 7.5 10 .2.1.3.1.5 0z"
      />
      <path fill="#FBBC05" d="M4.9 7.3l7.1 7.5V10L7.5 5.5c-1.1.5-2 1.2-2.6 1.8z" />
      <path fill="#EA4335" d="M12 2c-4.1 0-7.5 3.4-7.5 7.5 0 .8.1 1.6.4 2.3l7.1-4.3V2z" />
      <path fill="#1A73E8" d="M12 2v5.5l4.5 4.5c.3-.7.5-1.5.5-2.5 0-4.1-3.4-7.5-7.5-7.5z" />
      <circle cx="12" cy="9.5" r="3.2" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Official WhatsApp speech bubble with phone handset
 */
export function WhatsAppLogo({ size = 20, colored = false }: { size?: number; colored?: boolean }) {
  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="11" fill="#25D366" />
        <path
          fill="#FFFFFF"
          d="M17.5 14.3c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.1-.7-1.6-.9-2.1-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.3 5.3 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.2-.1-.4-.2-.7-.3z"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );
}

/**
 * Official YouTube red badge with white play triangle
 */
export function YouTubeLogo({ size = 20, colored = false }: { size?: number; colored?: boolean }) {
  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        />
        <polygon fill="#FFFFFF" points="9.545,15.568 15.818,12 9.545,8.432" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={socialIconPaths.youtube[0]} />
    </svg>
  );
}

/**
 * Official Facebook "f" logo
 */
export function FacebookLogo({ size = 20, colored = false }: { size?: number; colored?: boolean }) {
  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="11" fill="#0866FF" />
        <path
          fill="#FFFFFF"
          d="M14.5 12.5h-2v7h-3v-7h-1.5v-2.5h1.5v-1.7c0-2 1.2-3.1 3-3.1.9 0 1.6.1 1.8.1v2.1h-1.1c-1 0-1.2.5-1.2 1.2v1.4h2.4l-.4 2.5z"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={socialIconPaths.facebook[0]} />
    </svg>
  );
}

/**
 * Official Instagram logo (vibrant gradient or clean glyph)
 */
export function InstagramLogo({
  size = 20,
  colored = false,
}: {
  size?: number;
  colored?: boolean;
}) {
  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="single-action-insta" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </linearGradient>
        </defs>
        <rect width="22" height="22" x="1" y="1" rx="6" fill="url(#single-action-insta)" />
        <path
          fill="#FFFFFF"
          d="M12 6.8c-2.9 0-5.2 2.3-5.2 5.2s2.3 5.2 5.2 5.2 5.2-2.3 5.2-5.2-2.3-5.2-5.2-5.2zm0 8.6c-1.9 0-3.4-1.5-3.4-3.4s1.5-3.4 3.4-3.4 3.4 1.5 3.4 3.4-1.5 3.4-3.4 3.4zm5.4-8.8c0 .7-.5 1.2-1.2 1.2s-1.2-.5-1.2-1.2.5-1.2 1.2-1.2 1.2.5 1.2 1.2z"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={socialIconPaths.instagram[0]} />
    </svg>
  );
}

/**
 * Official LinkedIn "in" logo
 */
export function LinkedInLogo({ size = 20, colored = false }: { size?: number; colored?: boolean }) {
  if (colored) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <rect width="22" height="22" x="1" y="1" rx="4" fill="#0A66C2" />
        <path
          fill="#FFFFFF"
          d="M7.1 9.3H4.4V18h2.7V9.3zM5.7 8.2c.9 0 1.6-.7 1.6-1.6S6.6 5 5.7 5 4.1 5.7 4.1 6.6s.7 1.6 1.6 1.6zm13.9 9.8h-2.7v-4.3c0-1-.02-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2v4.4H11.2V9.3h2.6v1.2h.04c.36-.7 1.25-1.4 2.59-1.4 2.77 0 3.28 1.82 3.28 4.2v4.7z"
        />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={socialIconPaths.linkedin[0]} />
    </svg>
  );
}

/**
 * Official TikTok note logo
 */
export function TikTokLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={socialIconPaths.tiktok[0]} />
    </svg>
  );
}

export function SingleActionIcon({
  type,
  size = 20,
  colored = false,
}: {
  type: SingleActionType;
  size?: number;
  colored?: boolean;
}) {
  switch (type) {
    case 'google_review':
      return <GoogleGLogo size={size} />;
    case 'maps':
      return <GoogleMapsLogo size={size} />;
    case 'whatsapp':
      return <WhatsAppLogo size={size} colored={colored} />;
    case 'youtube':
      return <YouTubeLogo size={size} colored={colored} />;
    case 'facebook':
      return <FacebookLogo size={size} colored={colored} />;
    case 'instagram':
      return <InstagramLogo size={size} colored={colored} />;
    case 'linkedin':
      return <LinkedInLogo size={size} colored={colored} />;
    case 'tiktok':
      return <TikTokLogo size={size} />;
    case 'call':
      return <Phone size={size} />;
    case 'website':
      return <Globe size={size} />;
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
                    <SingleActionIcon type={typeKey} size={24} colored={true} />
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
                <SingleActionIcon type={selectedType} size={22} colored={true} />
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
