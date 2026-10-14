'use client';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
type LandingFeature = [LucideIcon, string, string, string, string, string];
import {
  Download,
  Phone,
  ImageIcon,
  FileText,
  Users,
  Calendar,
  Check,
  ExternalLink,
  LayoutDashboard,
  Link as LinkIcon,
  Nfc,
  Plus,
  Share2,
  Sparkles,
  Zap,
  ShieldCheck,
  Smartphone,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { WhatsAppIcon } from './card-helpers';

export default function LandingPage({
  ar,
  auth,
  Card,
  blank,
  onPricing,
}: {
  ar: boolean;
  auth: boolean;
  Card: ComponentType<any>;
  blank: any;
  onPricing: () => void;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr);

  return (
    <main className="landing">
      {/* 1. HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">
            <span />
            {t(
              'CARTE DE VISITE CONNECTÉE NFC & QR NOUVELLE GÉNÉRATION',
              'كارط ديجيتال NFC وQR الجيل الجديد',
            )}
          </span>
          <h1>
            {t('Toute votre activité.', 'النشاط ديالك كامل.')}
            <br />
            <em>{t('Une seule carte.', 'فكارط وحدة.')}</em>
          </h1>
          <p>
            {t(
              'Transmettez vos coordonnées, catalogue, réalisations et prise de rendez-vous d’un simple geste sans contact. Compatible tous smartphones, sans aucune application à installer.',
              'شارك معلومات التواصل، الكاتالوگ، الخدمة والمواعيد فلحظة بحركة وحدة وبلا تطبيق. متوافقة مع جميع التلفونات الذكية.',
            )}
          </p>
          <div className="landing-actions">
            <a
              className="primary"
              href={auth ? '/?app=1' : '/auth?mode=signup' + (ar ? '&lang=ar' : '')}
            >
              {t('Créer ma carte', 'صايب الكارط ديالي')}
              <Plus size={18} />
            </a>
            <a className="landing-link" href={'/demo' + (ar ? '?lang=ar' : '')}>
              {t('Voir la démo', 'شوف المثال')}
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="landing-proof">
            <Check size={16} />
            {t(
              'Sans application requise · NFC instantané ou QR code universel',
              'بلا تطبيق · NFC فالحين ولا QR كبديل شامل',
            )}
          </div>
        </div>

        {/* HERO SHOWCASE: LIVE CARD + NFC SMART CARD */}
        <div className="landing-showcase">
          <div className="showcase-caption">
            <span>{t('VOTRE UNIVERS PROFESSIONNEL EN 1 TAP', 'النشاط ديالك فـ نقرة وحدة')}</span>
            <Nfc size={16} />
          </div>
          <div className="showcase-phone">
            <Card
              d={{
                ...blank,
                name: t('Dr. Yasmine Alami', 'د. ياسمين العلمي'),
                business: t('Cabinet Dentaire & Esthétique', 'عيادة طب الأسنان والتجميل'),
                job: t('Chirurgien-Dentiste', 'طبيبة جراحة الأسنان'),
                bio: t(
                  'Expertise en soins dentaires modernes, esthétique du sourire et implantologie. Prenez rendez-vous en ligne en 1 clic.',
                  'خبرة فطب الأسنان الحديث وتجميل الابتسامة وزراعة الأسنان. حجز موعدك فالموقع بنقرة وحدة.',
                ),
                cardTheme: 'dark',
                color: '#d5b66f',
              }}
              small
            />
          </div>
          <div className="showcase-nfc" aria-hidden="true">
            <span dir="ltr">
              SoraLink <Nfc size={22} />
            </span>
            <strong>
              {t('Votre prochain contact\ncommence ici.', 'التواصل الجاي\nكيبدا من هنا.')}
            </strong>
            <span className="nfc-bottom">
              NFC + QR <Share2 size={16} />
            </span>
          </div>
          <div className="showcase-note">
            <span className="showcase-dot" />
            {t(
              'Exemple de carte réelle · Entièrement personnalisable à vos couleurs',
              'مثال ديال كارط حقيقية · كتخصّصها كاملة على ذوقك واللون ديالك',
            )}
          </div>
        </div>
      </section>

      {/* 2. TRANSMISSION MODES */}
      <section className="landing-sharing" aria-label={t('Modes de partage', 'طرق المشاركة')}>
        <p>
          {t(
            'Un seul lien. 3 façons instantanées de vous faire découvrir.',
            'رابط واحد، و3 طرق مباشرة باش يتعرفو عليك.',
          )}
        </p>
        <div>
          <span>
            <Nfc size={19} /> NFC sans contact
          </span>
          <span>
            <LayoutDashboard size={19} /> QR code dynamique
          </span>
          <span>
            <LinkIcon size={19} />
            {t('Lien web direct', 'رابط مباشر')}
          </span>
        </div>
      </section>

      {/* 3. CORE FEATURES */}
      <section className="landing-value" id="fonctionnalites">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('VOS OUTILS, AU MÊME ENDROIT', 'الأدوات ديالك فبلاصة وحدة')}
          </span>
          <h2>{t('Une carte. Des actions concrètes.', 'كارط وحدة، وخدمات واضحة.')}</h2>
          <p>
            {t(
              'Offrez à vos prospects une expérience interactive complète pour passer à l’action immédiatement.',
              'عطي للزبناء ديالك تجربة سريعة وساهلة باش يتواصلو ويطلبو خدماتك مباشرة.',
            )}
          </p>
        </div>
        <div className="landing-features">
          {(
            [
              [
                Download,
                '01',
                'Enregistrer votre contact',
                'تسجيل الكونطاكت',
                'Un bouton télécharge votre fiche contact vCard. Votre interlocuteur l’enregistre dans son répertoire en 1 clic.',
                'بزر واحد كيتحمّل الكونطاكت بصيغة vCard، واللي قدّامك كيحفظو فالريپيرطوار بنقرة وحدة.',
              ],
              [
                Phone,
                '02',
                'WhatsApp, réseaux et itinéraire',
                'WhatsApp، التواصل والطريق',
                'Appel direct, e-mail, WhatsApp, réseaux sociaux et itinéraire GPS Google Maps pour vous trouver facilement.',
                'اتصال مباشر، إيميل، WhatsApp، مواقع التواصل وموقع GPS فـ Google Maps باش يوصلو ليك بسهولة.',
              ],
              [
                ImageIcon,
                '03',
                'Catalogue, photos et vidéo',
                'الكاتالوگ، التصاور والفيديو',
                'Présentez jusqu’à 10 articles, une galerie de 10 photos, votre vidéo et un PDF téléchargeable pour valoriser votre offre.',
                'ورّي حتى 10 عروض، 10 تصاور، فيديو وكتيب PDF باش تبيّن الجودة ديال الخدمة ديالك.',
              ],
              [
                FileText,
                '04',
                'Demandes de devis et commandes',
                'طلبات الثمن والطلبات',
                'Vos prospects précisent leur besoin ou commandent un article. Retrouvez leurs coordonnées qualifiées dans votre espace.',
                'الزوار كيطلبو عروض أثمان ولا كيشريو عروضك. كتلقى الطلبات ومعلومات الزبناء فالحساب ديالك.',
              ],
              [
                Users,
                '05',
                'Échanger vos coordonnées',
                'تبادل معلومات التواصل',
                'Collectez instantanément les informations de vos prospects avec leur accord. S’ils ont une carte SoraLink, le partage est immédiat.',
                'جمع معلومات التواصل ديال الناس اللي كيتلاقاو بيك بموافقتهم، والتبادل كيكون فثواني.',
              ],
              [
                Calendar,
                '06',
                'Rendez-vous avec l’option Pro',
                'المواعيد مع Pro',
                'Définissez vos horaires et vos prestations. Vos visiteurs choisissent un créneau et vous confirmez dans votre agenda dédié.',
                'حدّد أوقات العمل والخدمات. الزبناء كيحجزو الوقت اللي ناسبهم ونتا كتأكد فالأجندة ديالك.',
              ],
            ] satisfies LandingFeature[]
          ).map(([Icon, n, title, da, desc, dd]) => (
            <article key={n}>
              <span className="feature-index">{n}</span>
              <Icon size={24} />
              <div>
                <h3>{t(title, da)}</h3>
                <p>{t(desc, dd)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. THREE STEPS */}
      <section className="landing-process">
        <div className="landing-heading">
          <span className="landing-kicker">{t('SIMPLE ET RAPIDE', 'ساهلة وسريعة')}</span>
          <h2>{t('Votre carte en trois étapes.', 'الكارط ديالك فثلاث خطوات.')}</h2>
        </div>
        <div className="landing-steps">
          {[
            [
              '01',
              'Créez votre compte',
              'صايب الحساب',
              'Inscrivez-vous en 30 secondes et confirmez votre e-mail en toute sécurité.',
              'تسجّل فـ 30 ثانية وأكّد الإيميل ديالك بأمان.',
            ],
            [
              '02',
              'Composez votre carte',
              'قاد الكارط ديالك',
              'Personnalisez votre logo, couverture, coordonnées, catalogue et style visuel.',
              'زيد اللوگو، الغلاف، معلومات التواصل، الكاتالوگ واللون اللي بغيتي.',
            ],
            [
              '03',
              'Publiez et partagez',
              'نشر وشارك',
              'Votre lien reste unique et permanent. Modifiez votre carte quand vous voulez : tout s’actualise en direct.',
              'الرابط ديالك كيبقى ديما صالح. بدّل أي معلومة وقتما بغيتي وكلشي كيتجدد فالحين.',
            ],
          ].map(([n, f, a, d, dd]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t(f, a)}</h3>
              <p>{t(d, dd)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 5. NFC HARDWARE */}
      <section className="landing-hardware" id="carte-nfc">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('DU DIGITAL AU PHYSIQUE', 'من الديجيتال للكارط')}
          </span>
          <h2>{t('Votre carte NFC. Votre lien.', 'كارط NFC والرابط ديالك.')}</h2>
          <p>
            {t(
              'La puce NFC transmet instantanément le lien de votre page à tout smartphone compatible. Approchez la carte de la zone de lecture du téléphone pour ouvrir la page. Sans NFC, scannez le QR code au verso.',
              'الـ NFC كيدوز رابط صفحتك مباشرة لتلفون متوافق. قرّب الكارط لظهر التلفون باش تفتح صفحتك. وبلا NFC، مسح الـ QR اللي فالظهر.',
            )}
          </p>
        </div>
        <div
          className="nfc-explainer"
          aria-label={t('Illustration du partage NFC', 'توضيح مشاركة NFC')}
        >
          <div className="nfc-mini-card">
            <span dir="ltr">SoraLink</span>
            <Nfc size={30} />
          </div>
          <div className="nfc-signal">
            <Nfc size={26} />
          </div>
          <div className="nfc-mini-phone">
            <span dir="ltr">SoraLink</span>
            <Check size={28} />
            <small>{t('Votre page', 'الصفحة ديالك')}</small>
          </div>
        </div>
        <p className="hardware-note">
          {t(
            'Le Pack Pro comprend une carte physique NFC personnalisée avec votre identité visuelle, ainsi que 100 cartes de visite imprimées de haute qualité avec votre QR code. Finition mate anti-rayures, étanche et résistante à vie.',
            'الپاك Pro فيه كارط NFC شخصية مطبوعة بالهوية ديالك، وزايد 100 كارت فيزيت مطبوعين بجودة عالية بالـ QR ديالك. مادة مقاومة للماء والخدش كتدوم سنين.',
          )}
        </p>
      </section>

      {/* 6. EXAMPLES / USE CASES */}
      <section className="landing-examples" id="exemples">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('POUR TOUS LES PROFESSIONNELS', 'لكل المهنيين')}
          </span>
          <h2>{t('Un format. Votre façon de travailler.', 'شكل واحد، على حساب خدمتك.')}</h2>
        </div>
        <div className="usecase-grid">
          {[
            [
              'Commercial & Dirigeant',
              'تجاري ومدير',
              'Fiche contact complète, pitch d’activité, liens réseaux et formulaires de devis.',
              'كونطاكت كامل، تقديم النشاط، روابط مباشرة وطلبات أثمان.',
            ],
            [
              'Cabinet & Profession Libérale',
              'عيادة ومكتب',
              'Coordonnées précises, itinéraire GPS fluide et prise de rendez-vous en ligne avec Pro.',
              'تواصل دقيق، طريق GPS ساهل وحجز مواعيد مباشرة مع Pro.',
            ],
            [
              'Artisan & Créateur',
              'صانع ومهني حر',
              'Galerie photo de réalisations, catalogue d’offres et prise de contact WhatsApp.',
              'تصاور الخدمة السابقة، كاتالوگ المنتجات وتواصل WhatsApp.',
            ],
            [
              'Restaurant & Commerce',
              'مطعم وتجارة',
              'Menu digital consultable, photos de plats, promotions du moment et avis.',
              'مينو رقمي، تصاور الأطباق، العروض الخاصة والموقع.',
            ],
          ].map(([f, a, d, dd]) => (
            <article key={f}>
              <h3>{t(f, a)}</h3>
              <p>{t(d, dd)}</p>
            </article>
          ))}
        </div>
        <a className="landing-link" href={'/demo' + (ar ? '?lang=ar' : '')}>
          {t('Explorer une carte de démonstration', 'شوف مثال كامل ديال الكارط')}
          <ExternalLink size={16} />
        </a>
      </section>

      {/* 7. PRICING */}
      <section className="landing-pricing" id="tarifs">
        <div className="landing-heading">
          <span className="landing-kicker">{t('TARIFS TRANSPARENTS', 'أثمنة واضحة')}</span>
          <h2>{t('Choisissez votre point de départ.', 'اختار منين تبدا.')}</h2>
          <p>
            {t(
              'Tarifs transparents sans abonnement automatique ni frais cachés. Paiement sécurisé par virement ou espèces après accord.',
              'أثمنة واضحة بلا اقتطاع أوتوماتيكي ولا مصاريف مخبية. الأداء بالتحويل أو كاش بعد الاتفاق.',
            )}
          </p>
        </div>
        <div className="landing-price-grid">
          {[
            [
              'Digital',
              149,
              'Carte digitale seule',
              'الكارط الديجيتال بوحدها',
              'Profil digital complet, QR code, catalogue, médias, promotions, demandes et mises à jour illimitées.',
              'صفحة كاملة، QR، الكاتالوگ، المحتوى، العروض والطلبات وتحديثات ديما بلا حدود.',
            ],
            [
              'Pack Pro NFC',
              349,
              'Digital + Carte NFC + 100 Cartes',
              'ديجيتال + كارط NFC + 100 كارت',
              'La formule complète : votre carte digitale + 1 carte NFC personnalisée + 100 cartes imprimées avec QR.',
              'العرض الأفضل: الديجيتال + كارط NFC بالاسم ديالك + 100 كارت فيزيت مطبوعة بالـ QR.',
            ],
            [
              'Accompagnement VIP',
              549,
              'Pack complet + Préparation sur mesure',
              'الپاك كامل + إعداد خاص',
              'Le Pack Pro NFC avec création clé en main de votre carte par nos designers et 2 séries de corrections.',
              'الپاك كامل مع تجهيز الكارط ديالك من طرف متخصصين وجوج مراحل ديال التعديل.',
            ],
          ].map(([n, p, f, a, d, dd], i) => (
            <article key={n} className={i === 1 ? 'featured' : ''}>
              <span className="eyebrow">{t(String(f), String(a))}</span>
              <h3 dir="ltr">{n}</h3>
              <strong className="landing-price">
                {p}
                <small> DH</small>
              </strong>
              <p className="hint">
                {i === 0 ? t('par an', 'فالعام') : t('la première année', 'فالعام الأول')}
              </p>
              <p>{t(String(d), String(dd))}</p>
              <a
                className={i === 1 ? 'primary full' : 'secondary full'}
                href={'/auth?mode=signup' + (ar ? '&lang=ar' : '')}
              >
                {t('Choisir cette offre', 'اختار هاد العرض')}
              </a>
              <small>{t('Renouvellement : 149 DH/an', 'التجديد: 149 درهم فالعام')}</small>
            </article>
          ))}
        </div>
        <div className="pricing-notes">
          <p>
            <Calendar size={18} />
            <strong>
              {t('Pro Rendez-vous : +250 DH/an', 'Pro Rendez-vous: +250 درهم فالعام')}
            </strong>{' '}
            {t(
              'Digital + Pro : 399 DH/an. Agenda SoraLink dédié avec gestion jusqu’à 5 prestations.',
              'Digital + Pro: 399 درهم فالعام. أجندة خاصة وحتى 5 خدمات مختلفة.',
            )}
          </p>
          <p>
            {t(
              '1 carte par compte · 10 photos · 10 articles · 400 Mo de stockage. Livraison express sur tout le Maroc.',
              'كارط وحدة للحساب · 10 تصاور · 10 عروض · 400 Mo تخزين. توصيل سريع لجميع مدن المغرب.',
            )}
          </p>
          <button className="landing-link" onClick={() => onPricing()}>
            {t('Détail des offres et assistance', 'تفاصيل العروض والمساعدة')}
          </button>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="landing-faq" id="faq">
        <div>
          <span className="landing-kicker">{t('EN TOUTE CLARTÉ', 'كلشي واضح')}</span>
          <h2>{t('Avant de commencer.', 'قبل ما تبدا.')}</h2>
        </div>
        <div>
          {[
            [
              'Comment payer ma commande ?',
              'كيفاش نخلّص الطلب؟',
              'Le paiement s’effectue simplement par virement bancaire ou en espèces après validation de votre commande. Tous les détails et le suivi vous sont confirmés avant tout règlement.',
              'الأداء كيكون ساهل بالتحويل البنكي ولا كاش من بعد تأكيد الطلب. كاع التفاصيل والتتبع كيتأكدو معاك قبل الأداء.',
            ],
            [
              'Est-ce compatible avec tous les smartphones ?',
              'واش متوافقة مع كاع التلفونات؟',
              'Oui, à 100%. Le NFC fonctionne nativement sur tous les iPhone récents et appareils Android. Pour les téléphones sans NFC, le QR code au verso et le lien web direct garantissent une ouverture instantanée.',
              'إيه 100%. الـ NFC كيخدم تلقائياً فجميع هواتف iPhone الحديثة وأندرويد. والتلفونات اللي ما فيهاش NFC يقدرو يمسحو الـ QR فالظهر.',
            ],
            [
              'Mes interlocuteurs doivent-ils installer une application ?',
              'واش خاص الناس يتيليشارجي كاش تطبيق؟',
              'Absolument pas ! Votre page s’ouvre directement dans le navigateur du smartphone de votre interlocuteur en un instant.',
              'أبداً! الصفحة ديالك كتحل مباشرة فالمتصفح ديال التلفون بلا حتى تطبيق.',
            ],
            [
              'Puis-je modifier mes informations après impression de la carte ?',
              'واش نقدر نبدّل معلوماتي من بعد ما تطبع الكارط؟',
              'Oui ! C’est tout l’avantage de SoraLink : vous pouvez mettre à jour vos coordonnées, photos, catalogue et tarifs à tout moment depuis votre espace. Votre carte physique et votre QR code restent toujours valables.',
              'إيه طبعاً! هادي هي الميزة ديال SoraLink: تبدّل معلوماتك وتصاورك وعروضك وقتما بغيتي من حسابك، والكارط ديالك كتبقى ديما محينة.',
            ],
            [
              'Quelle assistance est incluse ?',
              'شنو الدعم اللي كتوفروا؟',
              'Notre équipe vous accompagne du lundi au vendredi sur WhatsApp et par e-mail. L’offre Accompagnement VIP comprend en plus la configuration complète de votre carte par nos designers.',
              'الفريق ديالنا كيساعدك من الاثنين للجمعة فـ WhatsApp والإيميل. وعرض VIP فيه إعداد كامل للكارط من طرف المصممين ديالنا.',
            ],
            [
              'Y a-t-il un abonnement ou prélèvement automatique ?',
              'واش كاين اقتطاع شهري ولا أوتوماتيكي؟',
              'Aucun prélèvement automatique. Vous êtes totalement libre. Le service digital est annuel (149 DH/an) et vous décidez vous-même de son renouvellement.',
              'ما كاين حتى اقتطاع أوتوماتيكي. الخدمة سنوية (149 درهم/عام) ونتا اللي كتختار تجدد وقتما بغيتي بكل حرية.',
            ],
          ].map(([q, qa, a, aa]) => (
            <details key={q}>
              <summary>{t(q, qa)}</summary>
              <p>{t(a, aa)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 9. PILOT & FEEDBACK */}
      <section className="landing-pilot">
        <div>
          <span className="landing-kicker">{t('ÉCOUTE & ACCOMPAGNEMENT', 'كنسمعو ليك')}</span>
          <h3>{t('Vos retours font évoluer SoraLink.', 'الملاحظات ديالك كتطوّر SoraLink.')}</h3>
          <p>
            {t(
              'Explorez la démo et personnalisez votre présence digitale. Une question, un besoin spécifique pour votre entreprise ? Contactez notre équipe directement sur WhatsApp.',
              'جرّب المثال وصايب حضورك الرقمي. عندك سؤال ولا استفسار لمقاولتك؟ تواصل مع الفريق ديالنا مباشرة فـ WhatsApp.',
            )}
          </p>
          <a
            className="landing-link"
            href="https://wa.me/212661446664"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Discuter sur WhatsApp', 'تواصل فـ WhatsApp')}
            <WhatsAppIcon />
          </a>
        </div>
        <div>
          <h3>
            {t(
              'Un lien unique qui dure, une présence qui évolue.',
              'رابط واحد دائم، وحضور كيطوّر.',
            )}
          </h3>
          <p>
            {t(
              'Ne jetez plus vos cartes papier à chaque changement de poste, de numéro ou de tarif. SoraLink s’adapte à votre croissance et centralise toute votre activité professionnelle.',
              'ما تبقاش تضيع الكارطات فكل تبديل ديال النمرة ولا العنوان. SoraLink كتكبر مع المشروع ديالك وكتجمع كلشي فبلاصة وحدة.',
            )}
          </p>
        </div>
      </section>

      {/* 10. FINAL CTA BANNER */}
      <section className="landing-final">
        <div>
          <span className="landing-kicker">{t('COMMENCEZ AUJOURD’HUI', 'بدا اليوم')}</span>
          <h2>{t('Prêt à partager autrement ?', 'واجد تشارك بطريقة جديدة؟')}</h2>
          <p>
            {t(
              'Rejoignez les professionnels qui modernisent leur réseau avec la carte connectée SoraLink.',
              'انضم للمهنيين اللي طورو التواصل والشبكة ديالهم مع كارط SoraLink الذكية.',
            )}
          </p>
        </div>
        <a className="primary" href={'/auth?mode=signup' + (ar ? '&lang=ar' : '')}>
          {t('Créer ma carte', 'صايب الكارط ديالي')}
          <Plus size={18} />
        </a>
      </section>
    </main>
  );
}
