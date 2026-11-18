export type PrintProduct = {
  reference: string;
  image: string;
  title: readonly [string, string];
  description: readonly [string, string];
  alt: readonly [string, string];
  details: readonly (readonly [string, string])[];
};

// Product ideas, not a stock inventory or a promise of production capability.
export const printProducts: readonly PrintProduct[] = [
  {
    reference: 'SP-01',
    image: '/soraprint/references/cartes-reference-v1.webp',
    title: ['Cartes de visite', 'بطاقات الزيارة'],
    description: [
      'Votre activité sur un support à remettre en main propre. Une présentation claire, à garder après la rencontre.',
      'النشاط ديالكم فبطاقة كتعطيوها مباشرة. تقديم واضح كيبقى من بعد اللقاء.',
    ],
    alt: [
      'Illustration conceptuelle de cartes de visite blanches et jaunes sur une table.',
      'صورة توضيحية لبطاقات زيارة بيضاء وصفراء فوق طاولة.',
    ],
    details: [
      ['Format, papier et quantité à confirmer.', 'الشكل، الورق والكمية كيتأكدو فعرض الثمن.'],
      ['Avec votre visuel ou une création à étudier.', 'بالتصميم ديالكم ولا بتصميم نتفاهمو عليه.'],
    ],
  },
  {
    reference: 'SP-02',
    image: '/soraprint/references/flyers-reference-v1.webp',
    title: ['Flyers', 'منشورات إعلانية'],
    description: [
      'Une ouverture, un événement ou une offre à faire connaître. Un message lisible pour aller à l’essentiel.',
      'افتتاح، مناسبة ولا عرض بغيتو تعرفو به. رسالة واضحة كتوصل المهم.',
    ],
    alt: [
      'Illustration conceptuelle de flyers imprimés avec des formes jaunes et noires.',
      'صورة توضيحية لمنشورات مطبوعة بأشكال صفراء وسوداء.',
    ],
    details: [
      ['Pour votre commerce, association ou événement.', 'للمحل، الجمعية ولا المناسبة ديالكم.'],
      ['Message, format et quantité à préciser.', 'الرسالة، الشكل والكمية خاصها تتحدد.'],
    ],
  },
  {
    reference: 'SP-03',
    image: '/soraprint/references/stickers-reference-v1.webp',
    title: ['Stickers et étiquettes', 'ملصقات ولصيقات'],
    description: [
      'Identifiez vos produits, vos emballages et vos petites séries avec des étiquettes adaptées à votre projet.',
      'عرفو بالمنتوجات، التغليف والكميات الصغيرة ديالكم بملصقات مناسبة للمشروع.',
    ],
    alt: [
      'Illustration conceptuelle d’une planche d’étiquettes en papier et de stickers détachés.',
      'صورة توضيحية لورقة ملصقات ورقية ولصيقات منفصلة.',
    ],
    details: [
      ['Pour l’identification et l’emballage.', 'للتعريف بالمنتوج والتغليف.'],
      ['Support et découpe à choisir selon l’usage.', 'نوع الورق والتقطيع حسب الاستعمال.'],
    ],
  },
  {
    reference: 'SP-04',
    image: '/soraprint/references/papeterie-reference-v1.webp',
    title: ['Papeterie événementielle', 'مطبوعات المناسبات'],
    description: [
      'Invitations, menus et marque-places : des supports coordonnés pour accompagner vos moments importants.',
      'دعوات، قوائم الطعام وبطاقات الأسماء: مطبوعات متناسقة للمناسبات المهمة ديالكم.',
    ],
    alt: [
      'Illustration conceptuelle d’une invitation, d’un menu et d’un marque-place jaunes et blancs.',
      'صورة توضيحية لدعوة، قائمة طعام وبطاقة اسم باللونين الأبيض والأصفر.',
    ],
    details: [
      ['Une composition autour de votre thème.', 'تصميم متناسق مع موضوع المناسبة.'],
      ['Textes, quantité et date à préciser.', 'النصوص، الكمية والتاريخ خاصها تتحدد.'],
    ],
  },
];

export function printQuoteHref(product: PrintProduct, ar = false) {
  const message = ar
    ? `السلام عليكم SoraPrint، بغيت عرض ثمن لـ ${product.title[1]} (${product.reference}).\nالكمية: \nالشكل أو القياس المطلوب: \nالاستعمال ونوع الورق: \nالتاريخ المطلوب: \nواش عندي تصميم واجد: `
    : `Bonjour SoraPrint, je souhaite un devis pour ${product.title[0]} (${product.reference}).\nQuantité : \nFormat ou dimensions souhaités : \nUsage et papier souhaité : \nDate souhaitée : \nJ’ai déjà un visuel : `;
  return 'https://wa.me/212661446664?text=' + encodeURIComponent(message);
}
