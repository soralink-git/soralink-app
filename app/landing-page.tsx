'use client';
import type { ComponentType } from 'react';
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
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">
            <span />
            {t('LA CARTE QUI FAIT GRANDIR VOTRE ACTIVITÉ', 'كارط كتعاون النشاط ديالك يكبر')}
          </span>
          <h1>
            {t('Toute votre activité.', 'النشاط ديالك كامل.')}
            <br />
            <em>{t('Une seule carte.', 'فكارط وحدة.')}</em>
          </h1>
          <p>
            {t(
              'Votre carte NFC ouvre une page à votre image : coordonnées, catalogue, réalisations et rendez-vous. Partagez-la aussi par QR code ou par lien, puis actualisez-la depuis votre espace.',
              'كارط NFC كتفتح صفحة كتعبّر عليك: التواصل، الكاتالوگ، الخدمة والمواعيد. شاركها حتى بالـ QR ولا بالرابط، وحدّثها من الحساب ديالك.',
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
              'Sans application · NFC selon le téléphone, QR en alternative',
              'بلا تطبيق · NFC حسب التلفون، وQR كبديل',
            )}
          </div>
        </div>
        <div className="landing-showcase">
          <div className="showcase-caption">
            <span>{t('VOTRE ACTIVITÉ, EN UN LIEN', 'النشاط ديالك فرابط واحد')}</span>
            <Nfc size={16} />
          </div>
          <div className="showcase-phone">
            <Card
              d={{
                ...blank,
                name: t('Votre nom', 'الاسم ديالك'),
                business: t('Votre entreprise', 'المقاولة ديالك'),
                job: t('Votre savoir-faire', 'الخدمة ديالك'),
                bio: t(
                  'Présentez ce que vous faites. Donnez envie de vous contacter.',
                  'عرّف بالخدمة ديالك وخلّي الناس يتواصلو معاك.',
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
              NFC + QR <Share2 size={18} />
            </span>
          </div>
          <div className="showcase-note">
            <span className="showcase-dot" />
            {t(
              'Exemple de carte · entièrement personnalisable',
              'مثال ديال كارط · كتخصّصها على ذوقك',
            )}
          </div>
        </div>
      </section>
      <section className="landing-sharing" aria-label={t('Modes de partage', 'طرق المشاركة')}>
        <p>
          {t(
            'Un seul lien. Plusieurs façons de vous découvrir.',
            'رابط واحد، وطرق كثيرة باش يتعرفو عليك.',
          )}
        </p>
        <div>
          <span>
            <Nfc size={20} /> NFC
          </span>
          <span>
            <LayoutDashboard size={20} /> QR code
          </span>
          <span>
            <LinkIcon size={20} />
            {t('Lien direct', 'رابط مباشر')}
          </span>
        </div>
      </section>
      <section className="landing-value" id="fonctionnalites">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('VOS OUTILS, AU MÊME ENDROIT', 'الأدوات ديالك فبلاصة وحدة')}
          </span>
          <h2>{t('Une carte. Des actions concrètes.', 'كارط وحدة، وخدمات واضحة.')}</h2>
          <p>
            {t(
              'Choisissez ce que vos visiteurs voient et comment ils peuvent vous contacter.',
              'اختار شنو يشوفو الزوار وكيفاش يتواصلو معاك.',
            )}
          </p>
        </div>
        <div className="landing-features">
          {[
            [
              Download,
              '01',
              'Enregistrer votre contact',
              'تسجيل الكونطاكت',
              'Un bouton télécharge votre fiche contact vCard. Votre interlocuteur peut l’ajouter au répertoire de son téléphone.',
              'بزر واحد كيتحمّل الكونطاكت بصيغة vCard، واللي قدّامك يقدر يزيدو للريپيرطوار ديال التلفون.',
            ],
            [
              Phone,
              '02',
              'WhatsApp, réseaux et itinéraire',
              'WhatsApp، التواصل والطريق',
              'Téléphone, e-mail, WhatsApp, Instagram, LinkedIn, site web et Maps : activez uniquement les liens utiles à votre activité.',
              'التلفون، الإيميل، WhatsApp، Instagram، LinkedIn، الموقع وMaps: فعّل غير الروابط اللي محتاجها النشاط ديالك.',
            ],
            [
              ImageIcon,
              '03',
              'Catalogue, photos et vidéo',
              'الكاتالوگ، التصاور والفيديو',
              'Présentez jusqu’à 10 articles et 10 photos, un PDF et une vidéo. Mettez vos promotions en avant directement sur la carte.',
              'ورّي حتى 10 منتجات ولا خدمات و10 تصاور، PDF وفيديو. وزيد العروض ديالك مباشرة فالكارط.',
            ],
            [
              FileText,
              '04',
              'Demandes de devis et commandes',
              'طلبات الثمن والطلبات',
              'Vos visiteurs précisent leur besoin ou choisissent un article. Vous retrouvez leurs demandes et leurs coordonnées dans votre espace.',
              'الزوار كيوضحو شنو محتاجين ولا كيختارو عرض. كتلقى الطلبات ومعلومات التواصل فالحساب ديالك.',
            ],
            [
              Users,
              '05',
              'Échanger vos coordonnées',
              'تبادل معلومات التواصل',
              'Après la rencontre, votre prospect peut vous transmettre ses coordonnées avec son accord. S’il possède une carte SoraLink publiée, il peut la partager.',
              'من بعد التعارف، الزبون المحتمل يقدر يشارك معاك الكونطاكت بالموافقة ديالو. وإلا عندو كارط SoraLink منشورة يقدر يشاركها.',
            ],
            [
              Download,
              Phone,
              ImageIcon,
              FileText,
              Users,
              Calendar,
              '06',
              'Rendez-vous avec l’option Pro',
              'المواعيد مع Pro',
              'Définissez vos horaires et jusqu’à cinq prestations. Les visiteurs demandent un créneau ; vous confirmez les rendez-vous dans l’agenda SoraLink.',
              'حدّد الأوقات وحتى خمس خدمات. الزوار كيطلبو وقت، ونتا كتأكد المواعيد فالأجندة ديال SoraLink.',
            ],
          ].map(([Icon, n, title, da, desc, dd]: any) => (
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
      <section className="landing-process">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('SIMPLE À CRÉER. FACILE À PARTAGER.', 'ساهلة فالتصايب. ساهلة فالمشاركة.')}
          </span>
          <h2>{t('Votre carte en trois étapes.', 'الكارط ديالك فثلاث خطوات.')}</h2>
        </div>
        <div className="landing-steps">
          {[
            [
              '01',
              'Créez votre compte',
              'صايب الحساب',
              'Inscrivez-vous et confirmez votre e-mail.',
              'تسجّل وأكّد الإيميل ديالك.',
            ],
            [
              '02',
              'Composez votre carte',
              'وجد الكارط',
              'Ajoutez vos coordonnées et choisissez vos contenus.',
              'زيد معلومات التواصل واختار المحتوى.',
            ],
            [
              '03',
              'Publiez et partagez',
              'نشر وشارك',
              'Votre carte évolue, votre lien reste le même.',
              'الكارط كتتبدّل والرابط كيبقى هو هو.',
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
      <section className="landing-hardware" id="carte-nfc">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('DU DIGITAL AU PHYSIQUE', 'من الديجيتال للكارط')}
          </span>
          <h2>{t('Votre carte NFC. Votre lien.', 'كارط NFC والرابط ديالك.')}</h2>
          <p>
            {t(
              'Le NFC transmet le lien de votre page à un téléphone compatible. Selon le modèle, approchez la carte de la zone de lecture et ouvrez la notification. Sans NFC, scannez le QR ou utilisez le lien.',
              'NFC كيوصل رابط الصفحة لتلفون متوافق. حسب الموديل، قرّب الكارط للبلاصة ديال القراءة وحل الإشعار. بلا NFC، مسح QR ولا استعمل الرابط.',
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
            <Nfc size={25} />
          </div>
          <div className="nfc-mini-phone">
            <span dir="ltr">SoraLink</span>
            <Check size={28} />
            <small>{t('Votre page', 'الصفحة ديالك')}</small>
          </div>
        </div>
        <p className="hardware-note">
          {t(
            'Le Pack comprend une carte NFC personnalisée et 100 cartes imprimées avec QR. Le visuel est préparé avec votre identité et votre lien. Matériau, finition, résistance, garantie et remplacement sont précisés dans le récapitulatif avant commande. L’animation illustre le geste ; elle ne garantit pas un temps d’ouverture.',
            'الپاك فيه كارط NFC شخصية و100 كارط مطبوعة بالـ QR. التصميم كيتوجد بالهوية والرابط ديالك. المادة، الشكل، المقاومة، الضمان والتعويض كيتوضحو قبل الطلب. الأنيميشن غير توضيح للحركة، ماشي ضمان لسرعة الفتح.',
          )}
        </p>
      </section>
      <section className="landing-examples" id="exemples">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('ADAPTÉE À VOTRE ACTIVITÉ', 'على حساب النشاط ديالك')}
          </span>
          <h2>{t('Un format. Votre façon de travailler.', 'شكل واحد، على حساب خدمتك.')}</h2>
        </div>
        <div className="usecase-grid">
          {[
            [
              'Commercial',
              'تجاري',
              'Fiche contact, présentation et demandes de devis.',
              'كونطاكت، تقديم النشاط وطلبات الثمن.',
            ],
            [
              'Cabinet',
              'عيادة أو مكتب',
              'Coordonnées, itinéraire et rendez-vous avec Pro.',
              'التواصل، الطريق والمواعيد مع Pro.',
            ],
            [
              'Artisan',
              'صانع',
              'Réalisations, catalogue et commandes.',
              'الخدمة، الكاتالوگ والطلبات.',
            ],
            [
              'Restaurant',
              'مطعم',
              'Menu PDF, photos et promotions du moment.',
              'المينو PDF، التصاور والعروض.',
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
        <p className="hint">
          {t(
            'Exemple fictif. Vous personnalisez librement votre carte, sans modèle imposé par métier.',
            'مثال للتوضيح. كتخصّص الكارط بحرية، بلا موديل مفروض حسب المهنة.',
          )}
        </p>
      </section>
      <section className="landing-pricing" id="tarifs">
        <div className="landing-heading">
          <span className="landing-kicker">{t('LES OFFRES', 'العروض')}</span>
          <h2>{t('Choisissez votre point de départ.', 'اختار منين تبدا.')}</h2>
          <p>
            {t(
              'Tarifs de lancement proposés. Paiement manuel après confirmation, sans prélèvement automatique.',
              'أثمنة مقترحة للبداية. الأداء يدوي بعد التأكيد، بلا اقتطاع أوتوماتيكي.',
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
              'Profil, QR, catalogue, médias, promos et demandes.',
              'الصفحة، QR، الكاتالوگ، المحتوى، العروض والطلبات.',
            ],
            [
              'Pack',
              349,
              'Digital + vos supports',
              'ديجيتال والكارطات',
              'Digital + 1 carte NFC personnalisée + 100 cartes imprimées avec QR.',
              'Digital وكارط NFC شخصية و100 كارط مطبوعة بالـ QR.',
            ],
            [
              'Accompagnement',
              549,
              'La préparation en plus',
              'وزيد التحضير',
              'Le Pack + préparation de votre carte et 2 séries de corrections.',
              'الپاك وتحضير الكارط وجوج مراحل ديال التصحيح.',
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
              'Digital + Pro : 399 DH/an. Agenda SoraLink et jusqu’à 5 prestations.',
              'Digital + Pro: 399 درهم فالعام. أجندة SoraLink وحتى 5 خدمات.',
            )}
          </p>
          <p>
            {t(
              '1 carte digitale par compte · 10 photos · 10 articles · 400 Mo de stockage. Virement ou espèces, après accord. Livraison et frais à confirmer selon la destination.',
              'كارط ديجيتال وحدة للحساب · 10 تصاور · 10 عروض · 400 Mo. التحويل أو الكاش بعد الاتفاق. مدة وثمن التوصيل حسب الوجهة.',
            )}
          </p>
          <button className="landing-link" onClick={() => onPricing()}>
            {t('Détail des offres et assistance', 'تفاصيل العروض والمساعدة')}
          </button>
        </div>
      </section>
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
              'Le paiement est manuel, par virement ou espèces après confirmation de l’offre. Les frais et modalités sont communiqués avant règlement. Le paiement bancaire en ligne et le paiement à la livraison ne sont pas proposés ici comme disponibles.',
              'الأداء يدوي بالتحويل ولا الكاش من بعد تأكيد العرض. التفاصيل والمصاريف كيتوضحو قبل الأداء. الأداء بالكارت البنكية فالأنترنت ولا عند التوصيل ما كيتقدموش هنا كخدمات متوفرة.',
            ],
            [
              'Quelle assistance est incluse ?',
              'شنو المساعدة اللي داخلة؟',
              'Une assistance est prévue du lundi au vendredi, de 10 h à 18 h, avec une première réponse sous deux jours ouvrés. L’offre Accompagnement ajoute la préparation de votre carte et deux séries de corrections.',
              'المساعدة مبرمجة من الاثنين للجمعة، من10 حتى18، وأول جواب خلال يومين ديال الخدمة. Accompagnement فيه تحضير الكارط وجوج مراحل ديال التصحيح.',
            ],
            [
              'Est-ce compatible avec mon téléphone ?',
              'واش كاتخدم مع التلفون ديالي؟',
              'Le NFC nécessite un téléphone compatible et, selon le modèle, son activation. Le QR code ou le lien direct servent d’alternative pour ouvrir la carte dans le navigateur.',
              'NFC خاصو تلفون متوافق، وأحياناً خاص تفعّلو. QR ولا الرابط المباشر بديل باش تحل الكارط فالمتصفح.',
            ],
            [
              'Y a-t-il un abonnement ?',
              'واش كاين اشتراك؟',
              'Le service digital se renouvelle chaque année à 149 DH. L’option Pro ajoute 250 DH/an. La carte NFC est incluse la première année dans le Pack ; aucun abonnement mensuel ni prélèvement automatique.',
              'الديجيتال كيتجدّد كل عام بـ149 درهم. Pro كيزيد250 درهم فالعام. NFC داخلة فالعام الأول فالپاك، بلا اشتراك شهري ولا اقتطاع أوتوماتيكي.',
            ],
            [
              'Que faire si je perds ma carte NFC ?',
              'إلا ضاعت ليا كارط NFC؟',
              'Contactez-nous pour un remplacement. Vous pouvez retirer la publication de votre page depuis votre espace : cela rend indisponible le même lien pour tous vos supports, pas seulement la carte perdue.',
              'تواصل معانا للتعويض. تقدر توقف نشر الصفحة من الحساب، وهادشي كيوقف نفس الرابط فجميع الكارطات، ماشي غير اللي ضاعت.',
            ],
            [
              'Quels sont les délais de livraison ?',
              'شحال مدة التوصيل؟',
              'Le délai, les frais et les possibilités de livraison sont confirmés avant paiement selon la personnalisation et la destination. Aucun délai de 24–48 h n’est garanti à ce stade.',
              'المدة والثمن وإمكانية التوصيل كيتأكدو قبل الأداء حسب التخصيص والوجهة. دابا ما كاينش ضمان ديال24–48 ساعة.',
            ],
            [
              'Mes visiteurs doivent-ils créer un compte ?',
              'واش الزوار خاصهم حساب؟',
              'Non. Votre carte publiée est accessible par lien, QR ou NFC, sans inscription pour la consulter.',
              'لا. الكارط المنشورة كيتفتحوها بالرابط، QR ولا NFC بلا تسجيل.',
            ],
            [
              'Puis-je modifier ma carte après l’impression ?',
              'نقدر نبدّل الكارط من بعد الطباعة؟',
              'Oui. Mettez à jour votre page depuis votre espace client, sans changer le lien de votre QR ou NFC.',
              'إيه. بدّل الصفحة من الحساب ديالك بلا ما يتبدّل رابط QR ولا NFC.',
            ],
            [
              'Et si je préfère être accompagné ?',
              'وإلا بغيت المساعدة فالتصايب؟',
              'L’offre Accompagnement comprend la préparation de votre carte et deux séries de corrections. Consultez les offres pour le détail.',
              'عرض Accompagnement فيه تحضير الكارط وجوج مراحل ديال التصحيح. شوف العروض للتفاصيل.',
            ],
          ].map(([q, qa, a, aa]) => (
            <details key={q}>
              <summary>{t(q, qa)}</summary>
              <p>{t(a, aa)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-pilot">
        <div>
          <span className="landing-kicker">
            {t('UN SERVICE EN VERSION PILOTE', 'الخدمة فنسخة تجريبية')}
          </span>
          <h3>{t('Vos retours font évoluer SoraLink.', 'الملاحظات ديالك كتطوّر SoraLink.')}</h3>
          <p>
            {t(
              'Explorez la démo et testez votre carte sur vos appareils. Un doute, une idée ou un problème ? Écrivez-nous sur WhatsApp.',
              'شوف المثال وجرّب الكارط فالأجهزة ديالك. عندك سؤال، فكرة ولا مشكل؟ كتب لينا فـ WhatsApp.',
            )}
          </p>
          <a
            className="landing-link"
            href="https://wa.me/212661446664"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Partager mon retour', 'نشارك الملاحظة ديالي')}
            <WhatsAppIcon />
          </a>
        </div>
        <div>
          <h3>{t('Un lien qui reste, une page qui évolue.', 'الرابط كيبقى والصفحة كتتبدّل.')}</h3>
          <p>
            {t(
              'Modifiez votre activité sans réimprimer le QR à chaque changement. Réutilisez votre carte NFC lors de vos rencontres, et gardez le papier comme support complémentaire si vous le souhaitez.',
              'بدّل معلومات النشاط بلا ما تعاود تطبع QR فكل تغيير. استعمل نفس كارط NFC فالتعارف، وخلي الكارط الورقية مكملة إلا بغيتي.',
            )}
          </p>
        </div>
      </section>
      <section className="landing-final">
        <div>
          <span className="landing-kicker">
            {t('VOTRE PROCHAINE RENCONTRE', 'التعارف الجاي ديالك')}
          </span>
          <h2>{t('Prêt à partager autrement ?', 'واجد تشارك بطريقة جديدة؟')}</h2>
          <p>
            {t(
              'Composez votre carte, puis choisissez le support qui vous convient.',
              'وجد الكارط واختار الشكل اللي مناسب ليك.',
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
