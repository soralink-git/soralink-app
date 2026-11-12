'use client';
import './landing.css';
import OfferGrid from './offer-grid';
import {
  ExternalLink,
  Users,
  ShoppingBag,
  RefreshCw,
  Check,
  X,
  UtensilsCrossed,
  Store,
  Briefcase,
  TrendingUp,
  Star,
} from 'lucide-react';
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
            <span aria-hidden="true" />
            {t(
              'CARTE NFC + PAGE DIGITALE · SANS ABONNEMENT OBLIGATOIRE',
              'بطاقة NFC + صفحة رقمية · بدون اشتراك إجباري',
            )}
          </span>
          <h1>
            {t(
              'Ne perdez plus jamais un client après un premier contact.',
              'ما تفلت حتى زبون من بعد أول تواصل.',
            )}
          </h1>
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
              {t('Voir un exemple réel', 'شوف مثال حقيقي')}
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="landing-reassurance" role="note" aria-label="Garanties SoraLink">
            <span className="reassurance-item">
              <span className="check-badge">✓</span>
              {t('Prêt en 24h', 'جاهزة فـ 24 ساعة')}
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
              {t('Livraison partout au Maroc', 'توصيل لجميع مدن المغرب')}
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

      {/* Section B: Comparatif Carte Papier vs SoraLink */}
      <section className="landing-comparison" id="comparatif">
        <div className="landing-heading">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('LE COMPARATIF', 'مقارنة مباشرة')}
          </span>
          <h2>
            {t(
              'Pourquoi remplacer vos cartes papier dès aujourd’hui ?',
              'علاش تبدّل الكارط الورقية من اليوم؟',
            )}
          </h2>
          <p>
            {t(
              'La carte de visite papier finit trop souvent oubliée. Découvrez l’impact immédiat du digital pour votre activité.',
              'الكارط الورقية كتمشي بزاف دالمرات فالقمامة ولا كتنسى. شوف الفرق الحقيقي اللي كيديرو الرقمي للنشاط ديالك.',
            )}
          </p>
        </div>
        <div className="comparison-table">
          <div className="comparison-col paper-col">
            <div className="col-header">
              <span className="col-badge bad" aria-hidden="true">
                ✕
              </span>
              <h3>{t('Carte papier traditionnelle', 'الكارط الورقية التقليدية')}</h3>
            </div>
            <ul>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t(
                    'Finie au fond d’une poche ou à la poubelle.',
                    'كتنسى فالجيب ولا كتلاح فالقمامة.',
                  )}
                </span>
              </li>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t(
                    'Numéro ou adresse modifiés = tout réimprimer.',
                    'تبدلات النمرة ولا العنوان = خاص تعاود تطبع كلشي.',
                  )}
                </span>
              </li>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t(
                    'Aucun aperçu de vos prix ou réalisations.',
                    'حتى فكرة على الأثمنة، التصاور ولا الخدمات ديالك.',
                  )}
                </span>
              </li>
              <li>
                <X size={18} className="icon-bad" aria-hidden="true" />
                <span>
                  {t('Aucun suivi de vos prospects.', 'حتى متابعة للزبناء المهتمين ولا فرص البيع.')}
                </span>
              </li>
            </ul>
          </div>
          <div className="comparison-col soralink-col">
            <div className="col-header">
              <span className="col-badge good" aria-hidden="true">
                ✓
              </span>
              <h3>{t('SoraLink NFC & Digitale', 'SoraLink الذكية والرقمية')}</h3>
            </div>
            <ul>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>{t('Enregistrée en 1 clic', 'كتسجل فكليك واحد')}</strong>{' '}
                  {t('dans le répertoire du client (vCard).', 'فدليل الهاتف ديال الزبون (vCard).')}
                </span>
              </li>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>
                    {t('Modifiable à vie en 10 secondes', 'قابلة للتعديل مدى الحياة فـ 10 ثواني')}
                  </strong>{' '}
                  {t('sans changer de carte.', 'بلا ما تبدل الكارط.')}
                </span>
              </li>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>
                    {t(
                      'Catalogue produits, PDF et bouton WhatsApp',
                      'كاتالوج منتجات، PDF وزر WhatsApp',
                    )}
                  </strong>{' '}
                  {t('intégrés.', 'مدمجين.')}
                </span>
              </li>
              <li>
                <Check size={18} className="icon-good" aria-hidden="true" />
                <span>
                  <strong>
                    {t('Demandes de devis et rendez-vous', 'طلبات الأثمنة وحجز المواعيد')}
                  </strong>{' '}
                  {t('centralisés.', 'مجموعة فمكان واحد.')}
                </span>
              </li>
            </ul>
          </div>
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
                'Menu digital instantané sur table + lien direct vers vos avis Google 5 étoiles.',
                'مينيو رقمي فوري فوق الطابلة + رابط مباشر لتقييمات Google 5 نجوم.',
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
              'Choisissez les fonctions utiles à votre activité. Carte NFC physique et page digitale tout-en-un.',
              'اختار الوظائف اللي محتاجها للنشاط ديالك. كارط NFC مادية وصفحة رقمية كلشي فوحدة.',
            )}
          </p>
        </div>

        <OfferGrid ar={ar} auth={auth} />
      </section>

      {/* Section E: Preuve Sociale & Réassurance Maroc */}
      <section className="landing-testimonials" id="temoignages">
        <div className="landing-heading">
          <span className="landing-kicker">
            <span aria-hidden="true" />
            {t('ILS TÉMOIGNENT', 'آراء زبنائنا')}
          </span>
          <h2>{t('Ils font confiance à SoraLink au Maroc', 'كيثيقو فـ SoraLink فالمغرب')}</h2>
          <p>
            {t(
              'Des professionnels à Oujda, Casablanca, Fès et partout au Royaume boostent leur visibilité.',
              'محترفون من وجدة، الدار البيضاء، فاس وجميع مدن المغرب كيطورو نشاطهم مع SoraLink.',
            )}
          </p>
        </div>
        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="stars" aria-label="5 étoiles">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <blockquote>
              {t(
                '« Nos clients scannent le chevalet sur table pour voir le menu du jour et nous laissent un avis Google 5 étoiles en 3 secondes. Notre note Google a explosé. »',
                '« الزبناء كيمسحو الكود فوق الطابلة كيشوفو المينيو وكيخليو لينا تقييم 5 نجوم فـ Google فـ 3 ثواني. التقييم ديالنا طلع بزاف. »',
              )}
            </blockquote>
            <div className="testimonial-author">
              <strong>{t('Karim B.', 'كريم ب.')}</strong>
              <span>{t('Gérant de café & restaurant · Oujda', 'مسير مقهى ومطعم · وجدة')}</span>
            </div>
          </article>

          <article className="testimonial-card">
            <div className="stars" aria-label="5 étoiles">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <blockquote>
              {t(
                '« Fini les cartes papier qui se perdent. Mes patients enregistrent directement le numéro du cabinet, la localisation Maps et demandent un rendez-vous sans friction. »',
                '« تهنيت من الكارط الورقية اللي كتضيع. المرضى كيسجلو نمرة الكابيني مباشرة، كيشوفو الموقع فـ Maps وكيحجزو مواعيدهم بكل سهولة. »',
              )}
            </blockquote>
            <div className="testimonial-author">
              <strong>{t('Dr. Salma M.', 'د. سلمى م.')}</strong>
              <span>{t('Cabinet médical · Casablanca', 'عيادة طبية · الدار البيضاء')}</span>
            </div>
          </article>

          <article className="testimonial-card">
            <div className="stars" aria-label="5 étoiles">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <blockquote>
              {t(
                '« Le catalogue sur WhatsApp avec les prix et photos a transformé mes ventes. Les clients choisissent le modèle et m’écrivent directement pour commander. »',
                '« الكاتالوج فـ WhatsApp بالصور والأثمنة بدّل ليا طريقة البيع. الزبون كيختار الموديل وكيصيفط ليا ميساج نيشان باش يطلب. »',
              )}
            </blockquote>
            <div className="testimonial-author">
              <strong>{t('Youssef T.', 'يوسف ت.')}</strong>
              <span>
                {t('Boutique prêt-à-porter & Maroquinerie · Fès', 'محل ملابس وأحذية · فاس')}
              </span>
            </div>
          </article>
        </div>
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
