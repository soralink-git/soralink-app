'use client';
import './landing.css';
import OfferGrid from './offer-grid';
import {
  ExternalLink,
  Users,
  ShoppingBag,
  RefreshCw,
  Check,
  UtensilsCrossed,
  Store,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { WhatsAppIcon } from './card-helpers';

export default function LandingPage({ ar, auth }: { ar: boolean; auth: boolean }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  return (
    <main id="main-content" tabIndex={-1} className="landing landing-simple">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t(
              'CARTE NFC + PAGE DIGITALE · SANS ABONNEMENT OBLIGATOIRE',
              'بطاقة NFC + صفحة رقمية · بدون اشتراك إجباري',
            )}
          </span>
          <h1>{t('Votre activité, facile à partager.', 'النشاط ديالك، ساهل المشاركة.')}</h1>
          <p>
            {t(
              'Votre activité, à portée de main : partagez vos coordonnées, votre catalogue et votre localisation en 1 seconde par NFC ou QR code. Vos clients enregistrent votre contact et commandent sur WhatsApp sans installer d’application.',
              'النشاط ديالك، قريب ليك : شارك معلوماتك، الكاتالوج ديالك وموقعك فثانية وحدة بـ NFC ولا كود QR. الزبناء ديالك كيسجلو رقمك وكيطلبو عبر WhatsApp بلا ما يحتاجو يتيليشارجيو أي تطبيق.',
            )}
          </p>
          <div className="landing-actions">
            <a
              className="primary"
              href={
                'https://wa.me/212661446664?text=' +
                encodeURIComponent(
                  t(
                    'Bonjour, je souhaite commander une carte SoraLink NFC pour mon activité. Pouvez-vous me présenter les offres ?',
                    'السلام عليكم، بغيت نطلب كارط SoraLink NFC للنشاط ديالي. ممكن تعطيني معلومات على العروض؟',
                  ),
                )
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {t('Commander sur WhatsApp', 'طلب عبر WhatsApp')}
            </a>
            <a className="secondary" href={'/demo' + (ar ? '?lang=ar' : '')}>
              {t('Explorer la démo', 'شوف المثال التجريبي')}
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="landing-reassurance" role="note" aria-label="Garanties SoraLink">
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Préparation selon votre projet', 'التحضير حسب المشروع ديالكم')}
            </span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Zéro application à installer', 'بلا أي تطبيق')}
            </span>
            <span className="sep" aria-hidden="true">
              ·
            </span>
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Livraison à confirmer à la commande', 'التوصيل كيتأكد وقت الطلب')}
            </span>
          </div>
        </div>
        <div className="landing-brand-visual" id="exemples">
          <img
            src="/soralink-pack-hero.webp"
            width="1679"
            height="937"
            fetchPriority="high"
            alt={t(
              'Carte de visite digitale NFC et QR code SoraLink posée à côté d’un smartphone affichant un profil professionnel au Maroc.',
              'بطاقة عمل رقمية وكارطات SoraLink بتقنية NFC مع رمز QR بجانب هاتف ذكي يعرض صفحة مهنية في المغرب.',
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

      <section className="landing-comparison" id="comparatif">
        <div className="landing-heading">
          <span className="landing-kicker">{t('MIEUX ENSEMBLE', 'أحسن مجموعين')}</span>
          <h2>
            {t(
              'Votre carte papier et votre profil digital se complètent.',
              'الكارط الورقية والصفحة الرقمية كيكملو بعضياتهم.',
            )}
          </h2>
          <p>
            {t(
              'SoraPrint crée le support que vous remettez. SoraConnect prolonge le contact avec une page accessible par QR code ou NFC.',
              'SoraPrint كيصايب المطبوع اللي كتعطيو. SoraConnect كيكمل التواصل بصفحة كتتحل عبر QR أو NFC.',
            )}
          </p>
        </div>
        <div className="comparison-table">
          {[
            [
              'SoraPrint',
              'Un support à remettre en main propre.',
              'مطبوع كتعطيوه مباشرة.',
              'Une présence physique sur votre comptoir ou lors d’une rencontre.',
              'حضور ملموس فوق الكونطوار ولا فشي لقاء.',
              'Une création à préparer selon votre projet et votre quantité.',
              'تصميم كيتوجد حسب المشروع والكمية ديالكم.',
            ],
            [
              'SoraConnect',
              'Des coordonnées et des liens dans une page.',
              'معلومات التواصل والروابط فصفحة وحدة.',
              'Un contenu modifiable pendant votre abonnement.',
              'محتوى قابل للتعديل خلال الاشتراك.',
              'Un catalogue et des demandes selon les fonctions de votre pack.',
              'كاتالوغ وطلبات حسب وظائف الباقة ديالكم.',
            ],
          ].map(([name, f, a, g, b, h, c]) => (
            <div className="comparison-col" key={name}>
              <div className="col-header">
                <h3>{name}</h3>
              </div>
              <ul>
                {[
                  [f, a],
                  [g, b],
                  [h, c],
                ].map(([fr, ar]) => (
                  <li key={fr}>
                    <Check size={18} aria-hidden="true" />
                    <span>{t(fr, ar)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section C: Cas d'usage par métier */}
      <section className="landing-usecases" id="metiers">
        <div className="landing-heading">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('ADAPTÉ À VOTRE MÉTIER', 'لكل المجالات')}
          </span>
          <h2>{t('Une solution pensée pour votre activité', 'حل مفصّل على النشاط ديالك')}</h2>
          <p>
            {t(
              'Que vous receviez vos clients dans un établissement ou en déplacement, SoraLink s’adapte à votre métier.',
              'سواء كنت كتستقبل الزبناء فمحلك ولا كتحرك عندهم، SoraLink كيتماشى مع خدمتك.',
            )}
          </p>
        </div>
        <div className="usecase-grid">
          <article>
            <div className="usecase-icon-box">
              <UtensilsCrossed size={24} aria-hidden="true" />
            </div>
            <h3>{t('Restauration & Cafés', 'المطاعم والمقاهي')}</h3>
            <p>
              {t(
                'Menu digital sur table et lien vers votre page d’avis Google.',
                'مينيو رقمي فوق الطابلة ورابط لصفحة التقييمات ديالكم فـ Google.',
              )}
            </p>
          </article>
          <article>
            <div className="usecase-icon-box">
              <Store size={24} aria-hidden="true" />
            </div>
            <h3>{t('Commerçants & Boutiques', 'المحلات والتجارة')}</h3>
            <p>
              {t(
                'Catalogue produits avec photos, promotions et commande directe sur WhatsApp.',
                'كاتالوج منتجات بالصور، عروض تخفيضية وطلب مباشر عبر WhatsApp.',
              )}
            </p>
          </article>
          <article>
            <div className="usecase-icon-box">
              <Briefcase size={24} aria-hidden="true" />
            </div>
            <h3>{t('Professions libérales', 'المهن الحرة')}</h3>
            <span className="usecase-sub">
              {t('Médecins, Avocats, Architectes…', 'أطباء، محامون، مهندسون…')}
            </span>
            <p>
              {t(
                'Fiche contact enregistrable en 1 clic + itinéraire Google Maps + prise de rendez-vous.',
                'بطاقة تواصل كتسجل فكليك واحد + مسار Google Maps + حجز المواعيد.',
              )}
            </p>
          </article>
          <article>
            <div className="usecase-icon-box">
              <TrendingUp size={24} aria-hidden="true" />
            </div>
            <h3>{t('Entrepreneurs & Commerciaux', 'المقاولون والتجاريون')}</h3>
            <p>
              {t(
                'Une seule carte NFC réutilisable à l’infini en rendez-vous client ou salon professionnel.',
                'كارط NFC وحدة كتبقى معاك فكل لقاء، موعد ولا معرض مهني.',
              )}
            </p>
          </article>
        </div>
      </section>

      {/* Section D: Tarifs */}
      <section className="landing-pricing" id="tarifs">
        <div className="landing-heading">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('TARIFS TRANSPARENTS', 'أثمنة واضحة')}
          </span>
          <h2>{t('Les Offres', 'العروض ديالنا')}</h2>
          <p>
            {t(
              'Choisissez les fonctions utiles à votre activité. Page digitale selon le pack ; carte NFC incluse dans le Pack 1, en option dans les Packs 2 à 4.',
              'اختار الوظائف اللي محتاجها للنشاط ديالك. الصفحة الرقمية حسب الباقة؛ كارط NFC داخلة فالباقة 1 واختيارية فالباقات 2 حتى 4.',
            )}
          </p>
        </div>

        <OfferGrid ar={ar} auth={auth} />
      </section>

      <section className="landing-faq" id="faq">
        <div>
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('EN TOUTE CLARTÉ', 'كلشي واضح')}
          </span>
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
