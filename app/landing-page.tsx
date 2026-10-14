'use client';
import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
type LandingFeature = [LucideIcon, string, string, string, string, string];
import {
  Calendar,
  Check,
  ExternalLink,
  Globe,
  Nfc,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
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
      {/* 1. EN-TÊTE (HERO) */}
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">
            <span />
            {t('CARTE NFC & MINI-SITE PROFESSIONNEL', 'كارط NFC وسيت بروفيسيونيل')}
          </span>
          <h1>
            {t('Toute votre activité.', 'النشاط ديالك كامل.')}
            <br />
            <em>{t('En un seul geste.', 'فحركة وحدة.')}</em>
          </h1>
          <p>
            {t(
              'Partagez vos coordonnées, votre catalogue, vos réalisations et prenez des rendez-vous instantanément par carte NFC, QR code ou lien direct. Sans application.',
              'شارك معلومات التواصل، الكاتالوگ، الخدمة والمواعيد فالحين بكارط NFC، كود QR ولا رابط مباشر. بلا حتى تطبيق.',
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
              {t('Voir un exemple', 'شوف مثال')}
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* HERO SHOWCASE: LIVE CARD + NFC SMART CARD */}
        <div className="landing-showcase">
          <div className="showcase-caption">
            <span>{t('VOTRE UNIVERS PROFESSIONNEL EN 1 TAP', 'النشاط ديالك فـ نقرة وحدة')}</span>
            <Nfc size={16} />
          </div>
          <div className="showcase-phone">
            <div className="phone-notch">
              <span className="phone-speaker" />
            </div>
            <Card
              d={{
                ...blank,
                name: t('Dr. Yasmine Alami', 'د. ياسمين العلمي'),
                business: t('Cabinet Dentaire & Esthétique', 'عيادة طب الأسنان والتجميل'),
                job: t('Chirurgien-Dentiste & Esthétique', 'طبيبة جراحة الأسنان والتجميل'),
                bio: t(
                  'Soins dentaires modernes, esthétique du sourire et prise de rendez-vous en ligne en 1 clic.',
                  'علاجات الأسنان الحديثة، تجميل الابتسامة وحجز المواعيد بنقرة وحدة.',
                ),
                phone: '+212600000000',
                whatsapp: '+212661446664',
                email: 'contact@soralink.ma',
                address: 'Boulevard d’Anfa, Casablanca',
                website: 'https://soralink.link',
                instagram: 'https://instagram.com/soralink',
                linkedin: 'https://linkedin.com/company/soralink',
                cardTheme: 'dark',
                color: '#d5b66f',
                fondColor: '#0a0e16',
                blockColor: '#141b26',
                buttonColor: '#d5b66f',
                textColor: '#ffffff',
                buttonShape: 'rounded',
                avatarShape: 'circle',
                pro: true,
                cover:
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="220" viewBox="0 0 600 220"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231a2332"/><stop offset="50%" stop-color="%23263346"/><stop offset="100%" stop-color="%230f1622"/></linearGradient></defs><rect width="600" height="220" fill="url(%23g)"/><circle cx="120" cy="110" r="140" fill="%23d5b66f" opacity="0.12"/><circle cx="500" cy="90" r="160" fill="%23d5b66f" opacity="0.08"/></svg>',
                avatar:
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="ag" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ecd296"/><stop offset="100%" stop-color="%23d5b66f"/></linearGradient></defs><rect width="200" height="200" fill="%23141b26"/><circle cx="100" cy="100" r="94" fill="none" stroke="url(%23ag)" stroke-width="6"/><text x="100" y="122" font-family="system-ui,sans-serif" font-size="68" font-weight="800" fill="url(%23ag)" text-anchor="middle">YA</text></svg>',
                services: [
                  {
                    id: 's1',
                    type: 'service',
                    name: t('Consultation & Bilan', 'استشارة وتشخيص'),
                    price: '300 DH',
                    description: t(
                      'Examen complet et plan de traitement personnalisé.',
                      'فحص كامل وخطة علاج مخصصة.',
                    ),
                  },
                  {
                    id: 's2',
                    type: 'service',
                    name: t('Blanchiment & Esthétique', 'تبييض وتجميل'),
                    price: '800 DH',
                    description: t(
                      'Éclaircissement dentaire haute performance.',
                      'تبييض الأسنان بأحدث التقنيات.',
                    ),
                  },
                ],
                promotions: [
                  {
                    id: 'p1',
                    title: t('Offre Découverte -20%', 'عرض ترحيبي -20%'),
                    promoPrice: '240 DH',
                    regularPrice: '300 DH',
                    description: t(
                      'Valable sur votre première consultation en ligne.',
                      'صالح فالاستشارة الأولى بحجز مسبق.',
                    ),
                    enabled: true,
                  },
                ],
              }}
              preview
              withSections
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

      {/* 2. POURQUOI SORALINK ? (4 VRAIS ARGUMENTS DE VENTE) */}
      <section className="landing-value" id="fonctionnalites">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('POURQUOI SORALINK ?', 'علاش تختار SORALINK ؟')}
          </span>
          <h2>{t('Pourquoi SoraLink ?', 'علاش تختار SoraLink؟')}</h2>
          <p>
            {t(
              'Vos 4 vrais atouts pour moderniser vos échanges et booster votre activité.',
              '4 مميزات حقيقية باش تطوّر التواصل ديالك وتزيد من مداخيلك.',
            )}
          </p>
        </div>
        <div className="landing-features">
          {(
            [
              [
                Globe,
                '01',
                'Plus qu’une carte, un mini-site',
                'أكثر من كارت فيزيت، سيت كامل',
                'Fiche contact en 1 clic, WhatsApp, réseaux sociaux, localisation Maps, vidéo et document PDF.',
                'تسجيل الكونطاكت بنقرة وحدة، WhatsApp، مواقع التواصل، موقع Maps، فيديو وكتيب PDF.',
              ],
              [
                ShoppingBag,
                '02',
                'Catalogue & Devis intégrés',
                'كاتالوگ وطلبات أثمان مدمجة',
                'Exposez jusqu’à 10 articles/photos, affichez vos promos du moment et recevez des demandes de devis ou commandes directement.',
                'قدّم حتى 10 منتجات/تصاور، بيّن عروضك الترويجية واستقبل طلبات الدوڤي ولا الشراء مباشرة.',
              ],
              [
                Calendar,
                '03',
                'Prise de rendez-vous (Option Pro)',
                'المواعيد مع Pro',
                'Affichez vos disponibilités et laissez vos clients réserver un créneau dans votre agenda.',
                'بيّن أوقات الخدمة ديالك وخلي الزبناء يحجزو الموعد المناسب فالأجندة ديالك.',
              ],
              [
                Sparkles,
                '04',
                'Modifiable à l’infini',
                'تعديل بلا حدود وبلا إعادة طبع',
                'Changez vos prix, votre numéro ou vos offres à tout moment depuis votre téléphone. Votre carte et votre QR code restent les mêmes.',
                'بدّل الأثمنة، النمرة ولا العروض وقتما بغيتي من التلفون ديالك. الكارط والكود QR كيبقاو هما هما.',
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

      {/* 3. COMMENT ÇA MARCHE ? — EN 3 LIGNES */}
      <section className="landing-process">
        <div className="landing-heading">
          <span className="landing-kicker">{t('SIMPLE & RAPIDE', 'ساهلة وسريعة')}</span>
          <h2>{t('Comment ça marche ?', 'كيفاش كتخدم الكارط؟')}</h2>
        </div>
        <div className="landing-steps">
          {[
            [
              '01',
              'Composez votre page',
              'قاد الصفحة ديالك',
              'Composez votre page en quelques minutes (ou laissez-nous la créer pour vous).',
              'قاد صفحتك فدقائق قليلة (ولا خلي الفريق ديالنا يصايبها ليك).',
            ],
            [
              '02',
              'Partagez sans contact',
              'شارك فلحظة',
              'Partagez-la en approchant votre carte NFC, par scan QR code ou sur WhatsApp.',
              'شاركها فلحظة بتقريب كارط NFC، بمسح كود QR ولا عبر WhatsApp.',
            ],
            [
              '03',
              'Recevez vos opportunités',
              'استقبل الزبناء والطلبات',
              'Récupérez vos contacts et demandes de clients dans votre espace SoraLink.',
              'استقبل جهات الاتصال وطلبات الزبناء مباشرة فحسابك SoraLink.',
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

      {/* 4. POUR QUI ? — 1 PHRASE PAR MÉTIER + BOUTON DÉMO */}
      <section className="landing-examples" id="exemples">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('POUR TOUS LES PROFESSIONNELS', 'لكل المهنيين')}
          </span>
          <h2>{t('Pour qui ?', 'لمن مخصصة الكارط؟')}</h2>
        </div>
        <div className="usecase-grid">
          {[
            [
              'Commerciaux & Indépendants',
              'تجاريين ومهنيين أحرار',
              'Enregistrez votre contact en 1 seconde et recevez des demandes de devis.',
              'سجّل الكونطاكت فـ ثانية واستقبل طلبات الدوڤي.',
            ],
            [
              'Commerces & Restaurants',
              'محلات ومطاعم',
              'Affichez votre menu PDF, votre catalogue et vos promos du moment.',
              'بيّن المينو PDF، الكاتالوگ ديالك والعروض الحالية.',
            ],
            [
              'Cabinets & Services',
              'عيادات وخدمات',
              'Partagez votre itinéraire Maps et gérez vos prises de rendez-vous.',
              'شارك مسار Maps وسير حجز المواعيد ديالك.',
            ],
            [
              'Artisans & Créateurs',
              'حرفيين ومبدعين',
              'Montrez vos réalisations en photos/vidéo et prenez des commandes.',
              'ورّي خدمتك بالصور/الفيديو واستقبل طلبيات مباشرة.',
            ],
          ].map(([f, a, d, dd]) => (
            <article key={f}>
              <h3>{t(f, a)}</h3>
              <p>{t(d, dd)}</p>
            </article>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a className="landing-link" href={'/demo' + (ar ? '?lang=ar' : '')}>
            👉 {t('Explorer une carte de démonstration', 'شوف مثال كامل ديال الكارط')}
            <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* 5. LES OFFRES — CLAIRES ET ORIENTÉES VALEUR */}
      <section className="landing-pricing" id="tarifs">
        <div className="landing-heading">
          <span className="landing-kicker">{t('TARIFS TRANSPARENTS', 'أثمنة واضحة')}</span>
          <h2>{t('Les Offres', 'العروض ديالنا')}</h2>
          <p>
            {t(
              'Un mini-site complet et vos supports physiques, sans prélèvement automatique.',
              'سيت كامل مع الكارطات ديالك، بلا حتى اقتطاع أوتوماتيكي.',
            )}
          </p>
        </div>
        <div className="landing-price-grid">
          {/* Digital */}
          <article>
            <span className="eyebrow">
              {t('L’essentiel 100 % en ligne', 'الأساسي 100% أونلاين')}
            </span>
            <h3 dir="ltr">Digital</h3>
            <strong className="landing-price">
              149<small> DH</small>
            </strong>
            <p className="hint">{t('/ an', 'فالعام')}</p>
            <ul className="landing-price-features">
              <li>
                <Check size={16} />
                <span>
                  {t(
                    'Votre page complète (Profil, Catalogue, Promos, Devis)',
                    'صفحة كاملة (بروفايل، كاتالوگ، عروض، دوڤي)',
                  )}
                </span>
              </li>
              <li>
                <Check size={16} />
                <span>
                  {t('QR code et lien de partage illimité', 'كود QR ورابط مشاركة غير محدود')}
                </span>
              </li>
            </ul>
            <a className="secondary full" href={'/auth?mode=signup' + (ar ? '&lang=ar' : '')}>
              {t('Choisir Digital', 'اختار Digital')}
            </a>
            <small>{t('Renouvellement : 149 DH/an', 'التجديد: 149 درهم فالعام')}</small>
          </article>

          {/* Pack Hybride - Featured */}
          <article className="featured">
            <span className="eyebrow">{t('⭐ Le plus populaire', '⭐ الأكثر طلباً')}</span>
            <h3 dir="ltr">Pack Hybride</h3>
            <div className="landing-price-tagline">
              {t(
                'Le moderne + le classique pour ne rater aucun client',
                'العصري والتقليدي باش ما تضيع حتى زبون',
              )}
            </div>
            <strong className="landing-price">
              349<small> DH</small>
            </strong>
            <p className="hint">{t('la première année', 'فالعام الأول')}</p>
            <ul className="landing-price-features">
              <li>
                <Check size={16} />
                <span>
                  {t('Tout le forfait Digital inclus (1 an)', 'كل ما في باقة الديجيتال (1 عام)')}
                </span>
              </li>
              <li>
                <Check size={16} />
                <span>
                  {t(
                    '+ 1 Carte NFC personnalisée à votre image',
                    '+ 1 كارط NFC مخصصة بالهوية ديالك',
                  )}
                </span>
              </li>
              <li>
                <Check size={16} />
                <span>
                  {t(
                    '+ 100 Cartes papier imprimées avec votre QR code',
                    '+ 100 كارت فيزيت مطبوعة بالـ QR ديالك',
                  )}
                </span>
              </li>
            </ul>
            <a className="primary full" href={'/auth?mode=signup' + (ar ? '&lang=ar' : '')}>
              {t('Choisir le Pack', 'اختار هاد الپاك')}
            </a>
            <small>
              {t(
                'Renouvellement l’année suivante : 149 DH/an',
                'التجديد فالعام الموالي: 149 درهم فالعام',
              )}
            </small>
          </article>

          {/* Clé en main */}
          <article>
            <span className="eyebrow">
              {t('On s’occupe de tout pour vous', 'كنتكلفو ليك بكلشي')}
            </span>
            <h3 dir="ltr">Clé en main</h3>
            <div className="landing-price-tagline">
              {t('Accompagnement VIP', 'مرافقة VIP خاصة')}
            </div>
            <strong className="landing-price">
              549<small> DH</small>
            </strong>
            <p className="hint">{t('la première année', 'فالعام الأول')}</p>
            <ul className="landing-price-features">
              <li>
                <Check size={16} />
                <span>
                  {t(
                    'Tout le Pack Hybride inclus (Page + 1 carte NFC + 100 cartes QR)',
                    'كل ما في الپاك الهجين (سيت + 1 كارط NFC + 100 كارت QR)',
                  )}
                </span>
              </li>
              <li>
                <Check size={16} />
                <span>
                  {t(
                    '+ Création complète de votre page par notre équipe (avec 2 séries de retouches)',
                    '+ إعداد كامل لصفحتك من طرف فريقنا (مع مرحلتين للتعديل)',
                  )}
                </span>
              </li>
            </ul>
            <a className="secondary full" href={'/auth?mode=signup' + (ar ? '&lang=ar' : '')}>
              {t('Choisir Clé en main', 'اختار Clé en main')}
            </a>
            <small>
              {t(
                'Renouvellement l’année suivante : 149 DH/an',
                'التجديد فالعام الموالي: 149 درهم فالعام',
              )}
            </small>
          </article>
        </div>

        <div className="pricing-notes">
          <p>
            <Calendar size={18} />
            <strong>
              {t(
                'Option Pro (Rendez-vous) : +250 DH / an',
                'Option Pro (المواعيد): +250 درهم فالعام',
              )}
            </strong>{' '}
            {t(
              'Ajoutez un agenda de réservation en ligne (jusqu’à 5 prestations) à votre carte.',
              'زيد أجندة حجز المواعيد أونلاين (حتى لـ 5 خدمات) فصفحتك.',
            )}
          </p>
          <button className="landing-link" onClick={() => onPricing()}>
            {t('Détail des offres et assistance', 'تفاصيل العروض والمساعدة')}
          </button>
        </div>
      </section>

      {/* 6. FAQ — RÉDUITE AUX 4 VRAIES QUESTIONS D'ACHAT */}
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
              'Oui, à tout moment. Vos modifications s’appliquent instantanément sur votre page, sans jamais avoir à réimprimer votre carte NFC ou vos cartes papier.',
              'إيه، وقتما بغيتي. التعديلات كتبان فالحين فصفحتك، بلا ما تحتاج تعاود تطبع لا كارط NFC ولا الكارطات ديال الورق.',
            ],
            [
              'Pourquoi y a-t-il un renouvellement à 149 DH/an ?',
              'علاش كاين تجديد سنوي بـ 149 درهم/عام؟',
              'Cela couvre l’hébergement sécurisé de votre mini-site, de votre catalogue photos/PDF, de vos demandes de devis et les mises à jour techniques toute l’année (soit moins de 13 DH par mois).',
              'باش نضمنو ليك استضافة آمنة للسيت ديالك، الكاتالوگ، طلبات الدوڤي والتحديثات التقنية على طول العام (أقل من 13 درهم فالشهر).',
            ],
          ].map(([q, qa, a, aa]) => (
            <details key={q}>
              <summary>{t(q, qa)}</summary>
              <p>{t(a, aa)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 7. APPEL À L'ACTION FINAL (BAS DE PAGE) */}
      <section className="landing-final">
        <div>
          <span className="landing-kicker">{t('COMMENCEZ AUJOURD’HUI', 'بدا اليوم')}</span>
          <h2>
            {t(
              'Prêt à moderniser votre façon de réseauter ?',
              'واجد باش تطور طريقة التواصل ديالك؟',
            )}
          </h2>
          <p>
            {t(
              'Créez votre carte en ligne dès maintenant ou contactez-nous directement sur WhatsApp pour être accompagné.',
              'صايب الكارط ديالك أونلاين دابا ولا تواصل معانا مباشرة فـ WhatsApp باش نعاونوك.',
            )}
          </p>
        </div>
        <div className="landing-actions">
          <a
            className="primary"
            href={auth ? '/?app=1' : '/auth?mode=signup' + (ar ? '&lang=ar' : '')}
          >
            {t('Créer ma carte', 'صايب الكارط ديالي')}
            <Plus size={18} />
          </a>
          <a
            className="secondary"
            href="https://wa.me/212661446664"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Discuter sur WhatsApp', 'تواصل فـ WhatsApp')}
            <WhatsAppIcon />
          </a>
        </div>
      </section>
    </main>
  );
}
