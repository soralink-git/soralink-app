import { BRAND } from './brand';
import { offers, RENEWAL_PRICE } from './offers';

const categories = [
  { id: 'nfc', nameFr: 'Cartes NFC', nameAr: 'بطاقات NFC', visible: true },
  { id: 'platform', nameFr: 'Cartes digitales', nameAr: 'البطاقات الرقمية', visible: true },
  { id: 'support', nameFr: 'Accompagnement', nameAr: 'المواكبة', visible: true },
];
const annualFr = `Première année incluse. Renouvellement : ${RENEWAL_PRICE} DH/an pour conserver l’accès et les modifications. Carte NFC physique et livraison en supplément. Paiement manuel.`;
const annualAr = `العام الأول داخل فالثمن. التجديد بـ ${RENEWAL_PRICE} درهم فالعام باش يبقى الولوج والتعديل. بطاقة NFC والتوصيل كيتحسبو بوحدهم. الأداء يدوي.`;

export const soralinkTestCard = {
  name: 'SoraLink',
  business: 'Carte test · Oujda',
  job: 'Cartes NFC et identité digitale',
  bio: 'Partagez vos coordonnées, présentez vos offres et recevez les demandes de vos clients depuis une seule carte. Découvrez ici les offres SoraLink et un exemple de présentation complète.',
  avatar: '/favicon.svg',
  cover: '/soralink-pack-hero.webp',
  phone: '+212661446664',
  whatsapp: '+212661446664',
  email: 'contact@soralink.link',
  website: 'https://soralink.link',
  address: 'Oujda · Maroc',
  mapDestination: 'Oujda, Maroc',
  color: BRAND.orange,
  fondColor: BRAND.charcoal,
  blockColor: BRAND.slate,
  buttonColor: BRAND.orange,
  textColor: BRAND.white,
  cardTheme: 'dark',
  defaultLanguage: 'fr',
  pro: true,
  activity: true,
  catalogSettings: {
    enabled: true,
    products: true,
    pdf: false,
    whatsapp: true,
    showPrices: true,
    layout: 'grid',
    accent: BRAND.orange,
  },
  catalogCategories: categories,
  services: [
    {
      id: 'soralink-nfc',
      type: 'product',
      reference: 'SL-01',
      name: 'NFC · Une carte, une action',
      nameFr: 'NFC · Une carte, une action',
      nameAr: 'NFC · بطاقة وحدة، خدمة وحدة',
      description:
        'Une carte NFC programmée vers une seule destination : avis Google, WhatsApp ou votre lien. Sans compte SoraLink et sans abonnement à la plateforme. Livraison en supplément.',
      descriptionAr:
        'بطاقة NFC مبرمجة لرابط واحد: تقييم Google، WhatsApp ولا الرابط ديالك. بلا حساب SoraLink وبلا اشتراك فالمنصة. التوصيل كيتحسب بوحدو.',
      categoryId: 'nfc',
      category: 'Cartes NFC',
      categoryAr: 'بطاقات NFC',
      price: '99',
      availability: 'available',
    },
    ...offers.map((offer) => ({
      id: `soralink-${offer.id.toLowerCase()}`,
      type: 'service',
      reference: `SL-0${offer.number}`,
      name: offer.name[0],
      nameFr: offer.name[0],
      nameAr: offer.name[1],
      description: offer.features.map((feature) => feature[0]).join(' · ') + '. ' + annualFr,
      descriptionAr: offer.features.map((feature) => feature[1]).join(' · ') + '. ' + annualAr,
      categoryId: 'platform',
      category: 'Cartes digitales',
      categoryAr: 'البطاقات الرقمية',
      price: String(offer.price),
      availability: 'available',
    })),
    {
      id: 'soralink-support',
      type: 'service',
      reference: 'SL-05',
      name: 'Accompagnement personnalisé',
      nameFr: 'Accompagnement personnalisé',
      nameAr: 'مواكبة على القياس',
      description:
        'Besoin d’aide pour préparer vos textes, organiser votre catalogue ou choisir votre présentation ? Décrivez votre besoin pour recevoir un devis adapté.',
      descriptionAr:
        'بغيتي المعاونة فالنصوص، ترتيب الكاتالوگ ولا اختيار طريقة العرض؟ شرح لينا الحاجة ديالك باش نعطيوك الثمن على القياس.',
      categoryId: 'support',
      category: 'Accompagnement',
      categoryAr: 'المواكبة',
      price: '',
      availability: 'available',
    },
  ],
  appointmentServices: [
    { name: 'Découvrir SoraLink', duration: 15 },
    { name: 'Préparer ma carte digitale', duration: 30 },
    { name: 'Organiser mes produits et services', duration: 30 },
  ],
  promotions: [],
  photos: [],
};

export const soralinkTestCardArabic = {
  ...soralinkTestCard,
  business: 'بطاقة تجريبية · وجدة',
  job: 'بطاقات NFC والهوية الرقمية',
  bio: 'شارك معلومات التواصل، عرض الخدمات ديالك وتوصّل بطلبات الزبناء من بطاقة وحدة. هنا تقدر تشوف عروض SoraLink ومثال ديال بطاقة كاملة.',
  address: 'وجدة · المغرب',
  appointmentServices: [
    { name: 'نتعرّف على SoraLink', duration: 15 },
    { name: 'نوجد البطاقة الرقمية ديالي', duration: 30 },
    { name: 'نرتّب المنتجات والخدمات ديالي', duration: 30 },
  ],
};
