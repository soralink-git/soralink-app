export const singleActionTypes = [
  'google_review',
  'whatsapp',
  'call',
  'website',
  'facebook',
  'instagram',
  'tiktok',
  'linkedin',
  'youtube',
  'maps',
  'booking',
  'menu',
  'custom',
] as const;

export type SingleActionType = (typeof singleActionTypes)[number];

export interface SingleActionConfig {
  enabled: boolean;
  type: SingleActionType;
  value: string;
  message?: string;
  labelFr?: string;
  labelAr?: string;
}

export interface SingleActionMeta {
  id: SingleActionType;
  titleFr: string;
  titleAr: string;
  defaultLabelFr: string;
  defaultLabelAr: string;
  inputType: 'url' | 'tel' | 'phone_whatsapp';
  placeholderFr: string;
  placeholderAr: string;
  helperFr: string;
  helperAr: string;
  icon: string;
}

export const singleActionMetaMap: Record<SingleActionType, SingleActionMeta> = {
  google_review: {
    id: 'google_review',
    titleFr: 'Avis Google',
    titleAr: 'تقييم Google',
    defaultLabelFr: 'Laissez-nous un avis Google',
    defaultLabelAr: 'اترك لنا تقييماً على Google',
    inputType: 'url',
    placeholderFr: 'https://g.page/r/.../review',
    placeholderAr: 'https://g.page/r/.../review',
    helperFr: 'Lien direct pour déposer un avis 5 étoiles sur votre fiche Google Business.',
    helperAr: 'رابط مباشر لكتابة تقييم على صفحتك في Google Business.',
    icon: 'star',
  },
  whatsapp: {
    id: 'whatsapp',
    titleFr: 'WhatsApp direct',
    titleAr: 'محادثة WhatsApp',
    defaultLabelFr: 'Contactez-nous sur WhatsApp',
    defaultLabelAr: 'تواصل معنا عبر WhatsApp',
    inputType: 'phone_whatsapp',
    placeholderFr: '+212 600 000 000',
    placeholderAr: '+212 600 000 000',
    helperFr: 'Numéro WhatsApp avec indicatif (+212 pour le Maroc). Message prérempli facultatif.',
    helperAr: 'رقم واتساب مع الرمز الدولي (+212 للمغرب). يمكن إضافة رسالة تمهيدية اختيارية.',
    icon: 'whatsapp',
  },
  call: {
    id: 'call',
    titleFr: 'Appel téléphonique',
    titleAr: 'اتصال هاتفي',
    defaultLabelFr: 'Appelez-nous',
    defaultLabelAr: 'اتصل بنا مباشرة',
    inputType: 'tel',
    placeholderFr: '+212 522 00 00 00',
    placeholderAr: '+212 522 00 00 00',
    helperFr: 'Numéro de téléphone direct pour déclencher l’appel en un clic.',
    helperAr: 'رقم الهاتف المباشر للاتصال بنقرة واحدة.',
    icon: 'phone',
  },
  website: {
    id: 'website',
    titleFr: 'Site web',
    titleAr: 'موقع إلكتروني',
    defaultLabelFr: 'Visitez notre site web',
    defaultLabelAr: 'زيارة موقعنا الإلكتروني',
    inputType: 'url',
    placeholderFr: 'https://mon-entreprise.com',
    placeholderAr: 'https://mon-entreprise.com',
    helperFr: 'Adresse de votre site internet ou boutique en ligne.',
    helperAr: 'عنوان موقعك الإلكتروني أو متجرك على الإنترنت.',
    icon: 'globe',
  },
  facebook: {
    id: 'facebook',
    titleFr: 'Facebook',
    titleAr: 'فيسبوك',
    defaultLabelFr: 'Rejoignez-nous sur Facebook',
    defaultLabelAr: 'تابعنا على Facebook',
    inputType: 'url',
    placeholderFr: 'https://facebook.com/mon-entreprise',
    placeholderAr: 'https://facebook.com/mon-entreprise',
    helperFr: 'Lien vers votre page ou profil Facebook.',
    helperAr: 'رابط صفحتك أو حسابك على فيسبوك.',
    icon: 'facebook',
  },
  instagram: {
    id: 'instagram',
    titleFr: 'Instagram',
    titleAr: 'إنستغرام',
    defaultLabelFr: 'Suivez-nous sur Instagram',
    defaultLabelAr: 'تابعنا على Instagram',
    inputType: 'url',
    placeholderFr: 'https://instagram.com/mon-compte ou @mon-compte',
    placeholderAr: 'https://instagram.com/mon-compte أو @mon-compte',
    helperFr: 'Lien direct ou identifiant Instagram (@nom).',
    helperAr: 'رابط مباشر أو اسم المستخدم على إنستغرام (@اسم).',
    icon: 'instagram',
  },
  tiktok: {
    id: 'tiktok',
    titleFr: 'TikTok',
    titleAr: 'تيك توك',
    defaultLabelFr: 'Suivez-nous sur TikTok',
    defaultLabelAr: 'تابعنا على TikTok',
    inputType: 'url',
    placeholderFr: 'https://tiktok.com/@mon-compte ou @mon-compte',
    placeholderAr: 'https://tiktok.com/@mon-compte أو @mon-compte',
    helperFr: 'Lien vers votre profil TikTok.',
    helperAr: 'رابط حسابك على تيك توك.',
    icon: 'video',
  },
  linkedin: {
    id: 'linkedin',
    titleFr: 'LinkedIn',
    titleAr: 'لينكد إن',
    defaultLabelFr: 'Connectez-vous sur LinkedIn',
    defaultLabelAr: 'تواصل معنا على LinkedIn',
    inputType: 'url',
    placeholderFr: 'https://linkedin.com/in/... ou company/...',
    placeholderAr: 'https://linkedin.com/in/... أو company/...',
    helperFr: 'Lien vers votre profil personnel ou page entreprise.',
    helperAr: 'رابط ملفك الشخصي أو صفحة شركتك على لينكد إن.',
    icon: 'linkedin',
  },
  youtube: {
    id: 'youtube',
    titleFr: 'YouTube',
    titleAr: 'يوتيوب',
    defaultLabelFr: 'Découvrez notre chaîne YouTube',
    defaultLabelAr: 'شاهد قناتنا على YouTube',
    inputType: 'url',
    placeholderFr: 'https://youtube.com/@ma-chaine',
    placeholderAr: 'https://youtube.com/@ma-chaine',
    helperFr: 'Lien direct vers votre chaîne ou vidéo de présentation.',
    helperAr: 'رابط مباشر لقناتك أو فيديو تقديمي.',
    icon: 'youtube',
  },
  maps: {
    id: 'maps',
    titleFr: 'Localisation Google Maps',
    titleAr: 'خرائط Google Maps',
    defaultLabelFr: 'Trouvez-nous sur Google Maps',
    defaultLabelAr: 'موقعنا على Google Maps',
    inputType: 'url',
    placeholderFr: 'https://maps.app.goo.gl/...',
    placeholderAr: 'https://maps.app.goo.gl/...',
    helperFr: 'Lien de partage de votre position ou fiche Google Maps.',
    helperAr: 'رابط مشاركة موقعك أو عنوانك على خرائط Google.',
    icon: 'map-pin',
  },
  booking: {
    id: 'booking',
    titleFr: 'Prise de rendez-vous',
    titleAr: 'حجز موعد',
    defaultLabelFr: 'Prendre un rendez-vous',
    defaultLabelAr: 'احجز موعدك الآن',
    inputType: 'url',
    placeholderFr: 'https://calendly.com/... ou lien de réservation',
    placeholderAr: 'https://calendly.com/... أو رابط الحجز',
    helperFr: 'Lien vers votre outil de réservation externe (Calendly, Doctolib, etc.).',
    helperAr: 'رابط الحجز الخارجي الخاص بك.',
    icon: 'calendar',
  },
  menu: {
    id: 'menu',
    titleFr: 'Menu ou catalogue externe',
    titleAr: 'قائمة الطعام أو الكتالوج',
    defaultLabelFr: 'Consulter notre menu / catalogue',
    defaultLabelAr: 'اطّلع على قائمة الطعام / الكتالوج',
    inputType: 'url',
    placeholderFr: 'https://mon-restaurant.com/menu.pdf',
    placeholderAr: 'https://mon-restaurant.com/menu.pdf',
    helperFr: 'Lien vers votre carte, menu PDF ou catalogue en ligne.',
    helperAr: 'رابط لقائمة المأكولات، كتالوج PDF أو موقع الكتالوج.',
    icon: 'book-open',
  },
  custom: {
    id: 'custom',
    titleFr: 'Autre lien personnalisé',
    titleAr: 'رابط مخصص آخر',
    defaultLabelFr: 'Accéder à notre lien',
    defaultLabelAr: 'الانتقال إلى الرابط',
    inputType: 'url',
    placeholderFr: 'https://mon-lien-special.com',
    placeholderAr: 'https://mon-lien-special.com',
    helperFr: 'Définissez une adresse URL personnalisée et votre propre texte de bouton.',
    helperAr: 'حدد رابطاً مخصصاً ونص الزر الذي تريده.',
    icon: 'external-link',
  },
};

/**
 * Validates the value based on the chosen single action type.
 * Protects strictly against malicious protocols (javascript:, data:, etc.).
 */
export function isSingleActionValid(type: SingleActionType, value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Protect against dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  if (type === 'call') {
    // Phone must have at least 6 digits/characters and allowed phone symbols (+, space, -, (, ))
    return /^[\d\s+\-().]{6,25}$/.test(trimmed) && (trimmed.match(/\d/g) || []).length >= 6;
  }

  if (type === 'whatsapp') {
    // WhatsApp phone number
    const clean = trimmed.replace(/[^\d+]/g, '');
    return clean.length >= 7 && clean.length <= 20;
  }

  if (type === 'instagram' || type === 'tiktok') {
    // Allows @username or full URL
    if (/^@[a-zA-Z0-9._]{1,40}$/.test(trimmed)) return true;
  }

  // URLs
  try {
    const urlStr = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(urlStr);
    const validProto = url.protocol === 'http:' || url.protocol === 'https:';
    const validHost = url.hostname.includes('.') || url.hostname === 'localhost';
    return validProto && validHost;
  } catch {
    return false;
  }
}

/**
 * Formats the destination href based on action type and user inputs.
 */
export function formatSingleActionHref(
  type: SingleActionType,
  value: string,
  message?: string,
): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return '#';

  if (type === 'call') {
    const clean = trimmed.replace(/[^\d+]/g, '');
    return `tel:${clean}`;
  }

  if (type === 'whatsapp') {
    let clean = trimmed.replace(/[^\d]/g, '');
    // If Moroccan local format 06... or 07..., prepend 212
    if (clean.startsWith('0') && clean.length === 10) {
      clean = '212' + clean.slice(1);
    }
    const query = message && message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
    return `https://wa.me/${clean}${query}`;
  }

  if (type === 'instagram' && trimmed.startsWith('@')) {
    return `https://instagram.com/${trimmed.slice(1)}`;
  }

  if (type === 'tiktok' && trimmed.startsWith('@')) {
    return `https://tiktok.com/@${trimmed.slice(1)}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export interface ResolvedSingleAction {
  type: SingleActionType;
  href: string;
  label: string;
  isExternal: boolean;
  icon: string;
}

/**
 * Resolves the single action for rendering on the card (public or preview).
 * Returns null if disabled, missing, or invalid.
 */
export function resolveSingleAction(data: any, ar = false): ResolvedSingleAction | null {
  const config = data?.singleAction as SingleActionConfig | undefined;
  if (!config || !config.enabled || !config.value) return null;

  const type = singleActionTypes.includes(config.type) ? config.type : 'google_review';
  if (!isSingleActionValid(type, config.value)) return null;

  const meta = singleActionMetaMap[type] || singleActionMetaMap.google_review;
  const href = formatSingleActionHref(type, config.value, config.message);

  let label = ar ? meta.defaultLabelAr : meta.defaultLabelFr;
  if (type === 'custom') {
    if (ar && config.labelAr && config.labelAr.trim()) {
      label = config.labelAr.trim();
    } else if (!ar && config.labelFr && config.labelFr.trim()) {
      label = config.labelFr.trim();
    } else if (config.labelFr && config.labelFr.trim()) {
      label = config.labelFr.trim();
    } else if (config.labelAr && config.labelAr.trim()) {
      label = config.labelAr.trim();
    }
  }

  const isExternal = type !== 'call';

  return {
    type,
    href,
    label,
    isExternal,
    icon: meta.icon,
  };
}
