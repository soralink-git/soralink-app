'use client';
import OfferGrid from './offer-grid';
import { ExternalLink, Users, ShoppingBag, RefreshCw } from 'lucide-react';
import { WhatsAppIcon } from './card-helpers';

export default function LandingPage({
  ar,
  auth,
  onPricing,
}: {
  ar: boolean;
  auth: boolean;
  onPricing: () => void;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  return (
    <main className="landing landing-simple">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">
            {t('CARTE NFC + PAGE DIGITALE', 'كارط NFC وصفحة رقمية')}
          </span>
          <h1>
            {t('Votre activité.', 'النشاط ديالك.')}
            <br />
            <em>{t('Dans une seule carte.', 'فكارط وحدة.')}</em>
          </h1>
          <p>
            {t(
              'Vos contacts, vos produits et vos services. À partager par NFC, QR code ou lien, sans application à installer.',
              'معلومات التواصل، المنتجات والخدمات ديالك. شاركهم بـ NFC، كود QR ولا رابط، بلا تحميل أي تطبيق.',
            )}
          </p>
          <div className="landing-actions">
            <a className="secondary" href={'/demo' + (ar ? '?lang=ar' : '')}>
              {t('Voir un exemple', 'شوف مثال')}
              <ExternalLink size={16} />
            </a>
            <a
              className="primary"
              href={
                'https://wa.me/212661446664?text=' +
                encodeURIComponent(
                  t(
                    'Bonjour, je souhaite commander une carte SoraLink NFC. Pouvez-vous me présenter les offres ?',
                    'السلام عليكم، بغيت نطلب كارط SoraLink NFC. ممكن تعطيني معلومات على العروض؟',
                  ),
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {t('Commander sur WhatsApp', 'طلب عبر WhatsApp')}
            </a>
          </div>
        </div>
        <div className="landing-brand-visual" id="exemples">
          <img
            src="/soralink-pack-hero.webp"
            width="1679"
            height="937"
            fetchPriority="high"
            alt={t(
              'Cartes NFC et cartes de visite SoraLink avec QR code, à côté d’un téléphone présentant une page digitale.',
              'كارطات SoraLink بتقنية NFC وكود QR، حدا تلفون كيعرض صفحة رقمية.',
            )}
          />
        </div>
      </section>
      <section
        className="landing-quick-benefits"
        id="fonctionnalites"
        aria-label={t('SoraLink en bref', 'SoraLink باختصار')}
      >
        {[
          [
            Users,
            'Partagez vos contacts',
            'شارك معلومات التواصل',
            'Téléphone, WhatsApp et réseaux.',
            'التلفون، WhatsApp ومواقع التواصل.',
          ],
          [
            ShoppingBag,
            'Présentez vos offres',
            'قدّم العروض ديالك',
            'Produits, services et catalogue PDF.',
            'منتجات، خدمات وكاتالوگ PDF.',
          ],
          [
            RefreshCw,
            'Modifiez à tout moment',
            'بدّل وقتما بغيتي',
            'Le même lien et la même carte.',
            'نفس الرابط ونفس الكارط.',
          ],
        ].map(([Icon, fr, da, text, textAr], i) => {
          const Symbol = Icon as typeof Users;
          return (
            <article key={i}>
              <Symbol size={28} aria-hidden="true" />
              <h2>{t(fr as string, da as string)}</h2>
              <p>{t(text as string, textAr as string)}</p>
            </article>
          );
        })}
      </section>
      <section className="landing-pricing" id="tarifs">
        <div className="landing-heading">
          <span className="landing-kicker">{t('TARIFS TRANSPARENTS', 'أثمنة واضحة')}</span>
          <h2>{t('Les Offres', 'العروض ديالنا')}</h2>
          <p>
            {t(
              'Choisissez les fonctions utiles à votre activité.',
              'اختار الوظائف اللي محتاجها للنشاط ديالك.',
            )}
          </p>
        </div>

        <OfferGrid ar={ar} auth={auth} />
      </section>

      <section className="landing-faq" id="faq">
        <div>
          <span className="landing-kicker">{t('EN TOUTE CLARTÉ', 'كلشي واضح')}</span>
          <h2>{t('Foire aux questions', 'الأسئلة الشائعة')}</h2>
        </div>
        <div>
          {[
            [
              'Est-ce que ça marche sur tous les téléphones ?',
              'واش كيخدم فجميع التلفونات؟',
              'Oui ! Par simple approche (NFC) sur la majorité des smartphones récents, ou en scannant le QR code intégré. Aucune application n’est nécessaire pour vos clients.',
              'إيه! بمجرد تقريب الكارط (NFC) فالتلفونات الحديثة، ولا بمسح كود QR المدمج. بلا ما يحتاج الزبون يتيليشارجي أي تطبيق.',
            ],
            [
              'Comment se passe le paiement et la livraison ?',
              'كيفاش كيتم الأداء والتوصيل؟',
              'Vous validez d’abord votre commande et votre visuel avec nous. Le règlement se fait ensuite simplement par virement bancaire ou en espèces, et nous vous confirmons le délai d’expédition selon votre ville.',
              'كتأكد التصميم والطلب ديالك معانا أولاً. من بعد كيتم الأداء بالتحويل البنكي ولا كاش، وكنأكدو ليك مدة التوصيل على حساب مدينتك.',
            ],
            [
              'Puis-je modifier mes informations après l’impression des cartes ?',
              'واش نقدر نبدل معلوماتي من بعد ما تطبع الكارط؟',
              'Avec les packs 2, 3 et 4, modifiez vos contenus à tout moment pendant votre abonnement. Le lien de votre carte reste le même. Le pack 1 ouvre directement le lien choisi lors de la commande.',
              'فالباقات 2 و3 و4، بدّل المحتوى وقتما بغيتي خلال الاشتراك. الرابط كيبقى هو هو. الباقة 1 كتحل مباشرة الرابط اللي اخترتي فالطلب.',
            ],
            [
              'Pourquoi y a-t-il un renouvellement à 149 DH/an ?',
              'علاش كاين تجديد سنوي بـ 149 درهم/عام؟',
              'Pour les packs 2, 3 et 4, les 149 DH/an couvrent l’hébergement, les modifications de vos contenus et les mises à jour. Toutes les fonctions du pack choisi sont conservées au renouvellement. Le pack 1 à 99 DH n’a pas d’abonnement.',
              'فالباقات 2 و3 و4، 149 درهم فالعام كتشمل الاستضافة، تعديل المحتوى والتحديثات. جميع وظائف الباقة كتبقى من بعد التجديد. الباقة 1 بـ99 درهم بلا اشتراك.',
            ],
          ].map(([q, qa, a, aa]) => (
            <details key={q}>
              <summary>{t(q, qa)}</summary>
              <p>{t(a, aa)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <div>
          <h2>{t('On prépare votre carte ?', 'نوجدو ليك الكارط؟')}</h2>
          <p>
            {t(
              'Une question ? Nous vous accompagnons sur WhatsApp.',
              'عندك شي سؤال؟ كنعاونوك فـ WhatsApp.',
            )}
          </p>
        </div>
        <a
          className="primary"
          href="https://wa.me/212661446664"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Parlons de votre carte', 'نهضرو على الكارط ديالك')}
          <WhatsAppIcon />
        </a>
      </section>
    </main>
  );
}
