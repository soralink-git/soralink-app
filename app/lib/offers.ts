// Shared commercial rules. Historical accounts retain the rights sold with their offer.
export const platformPlans = ['Identite', 'Catalogue', 'Activite'] as const;
export const legacyPlans = ['Digital', 'Pack', 'Accompagnement', 'Pro'] as const;
export const acceptedPlans = [...platformPlans, ...legacyPlans] as const;
export const RENEWAL_PRICE = 149;
export const offers = [
  {
    id: 'Identite',
    number: 2,
    price: 149,
    name: ['E‑Identité', 'الهوية الرقمية'],
    features: [
      ['Logo, modèle et coordonnées', 'اللوگو، الستايل ومعلومات التواصل'],
      ['Réseaux sociaux et liens', 'مواقع التواصل والروابط'],
      ['Lien personnel et QR code', 'رابط شخصي ورمز QR'],
    ],
  },
  {
    id: 'Catalogue',
    number: 3,
    price: 249,
    name: ['Produits et services', 'المنتجات والخدمات'],
    features: [
      ['Tout le pack E‑Identité', 'كلشي ديال باقة الهوية الرقمية'],
      ['40 articles, catégories et catalogue PDF', '40 منتج وخدمة، تصنيفات وكاتالوگ PDF'],
      ['Promotions et commandes sur WhatsApp', 'عروض وطلبات عبر WhatsApp'],
    ],
  },
  {
    id: 'Activite',
    number: 4,
    price: 499,
    name: ['Suivi de mon activité', 'تتبّع النشاط ديالي'],
    features: [
      ['Tout le pack Produits et services', 'كلشي ديال باقة المنتجات والخدمات'],
      ['Demandes clients et contacts centralisés', 'طلبات الزبناء ومعلومات التواصل فبلاصة وحدة'],
      ['Gestion des rendez-vous et notifications e-mail', 'تدبير المواعيد وإشعارات بالإيميل'],
    ],
  },
] as const;
export function isPlatformPlan(plan: unknown): plan is (typeof platformPlans)[number] {
  return platformPlans.includes(plan as any);
}
export function capabilities(profile?: { plan?: string; pro_enabled?: unknown } | null) {
  const plan = profile?.plan;
  const legacy = legacyPlans.includes(plan as any);
  return {
    catalogue: plan === 'Catalogue' || plan === 'Activite' || legacy,
    activity: plan === 'Activite' || legacy,
    appointments: plan === 'Activite' || (legacy && !!profile?.pro_enabled),
    legacy,
  };
}
export function offerPrice(plan: string) {
  return offers.find((offer) => offer.id === plan)?.price;
}
export function annualExpiry(expires: string | null | undefined, paid: boolean, now = new Date()) {
  const date = new Date(paid && expires && Date.parse(expires) > now.getTime() ? expires : now);
  const month = date.getUTCMonth();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  // February 29 renews to February 28 in a non-leap year.
  if (date.getUTCMonth() !== month) date.setUTCDate(0);
  return date.toISOString();
}
