'use client';
import { signupPath } from './lib/journey-links';
import { useState, type ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
type LandingFeature = [LucideIcon, string, string, string, string, string];
import {
  Calendar,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Globe,
  Heart,
  Layers,
  MapPin,
  Nfc,
  Package,
  Plus,
  QrCode,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
  Wifi,
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
  const [activePersona, setActivePersona] = useState(0);

  const personas = [
    {
      id: 'commercial',
      badge: t('COMMERCIAL & INDÉPENDANT', 'تجاري ومهني حر'),
      badgeColor: '#2563EB',
      title: t('Commerciaux & Indépendants', 'تجاريين ومهنيين أحرار'),
      desc: t(
        'Enregistrez votre contact en 1 seconde et recevez des demandes de devis.',
        'سجّل الكونطاكت فـ ثانية واستقبل طلبات الدوڤي.',
      ),
      icon: '💼',
      highlight: t(
        'Bouton vCard 1-clic · Formulaire de devis express · Liens LinkedIn & WhatsApp',
        'حفظ جهة الاتصال بنقرة وحدة · طلب دوڤي سريع · روابط LinkedIn وWhatsApp',
      ),
    },
    {
      id: 'restaurant',
      badge: t('COMMERCE & RESTAURATION', 'محلات ومطاعم'),
      badgeColor: '#EA580C',
      title: t('Commerces & Restaurants', 'محلات ومطاعم'),
      desc: t(
        'Affichez votre menu PDF, votre catalogue et vos promos du moment.',
        'بيّن المينو PDF، الكاتالوگ ديالك والعروض الحالية.',
      ),
      icon: '🍕',
      highlight: t(
        'Menu digital PDF sans contact · Galerie photos de plats · Promos flash du jour',
        'مينو رقمي بلا لمس · صور الأطباق · عروض ترويجية يومية',
      ),
    },
    {
      id: 'cabinet',
      badge: t('SANTÉ & PROFESSIONS LIBÉRALES', 'عيادات وخدمات'),
      badgeColor: '#0D9488',
      title: t('Cabinets & Services', 'عيادات وخدمات'),
      desc: t(
        'Partagez votre itinéraire Maps et gérez vos prises de rendez-vous.',
        'شارك مسار Maps وسير حجز المواعيد ديالك.',
      ),
      icon: '🩺',
      highlight: t(
        'Itinéraire GPS Maps en 1 clic · Réservation de créneau Pro · Horaires d’ouverture',
        'مسار GPS خرائط بنقرة وحدة · حجز موعد Pro أونلاين · أوقات العمل',
      ),
    },
    {
      id: 'artisan',
      badge: t('ARTISANAT & CRÉATION', 'حرفيين ومبدعين'),
      badgeColor: '#D97706',
      title: t('Artisans & Créateurs', 'حرفيين ومبدعين'),
      desc: t(
        'Montrez vos réalisations en photos/vidéo et prenez des commandes.',
        'ورّي خدمتك بالصور/الفيديو واستقبل طلبيات مباشرة.',
      ),
      icon: '🛠️',
      highlight: t(
        'Galerie portfolio de réalisations · Vidéo de présentation · Commande directe WhatsApp',
        'معرض صور الإنجازات · فيديو تعريفي · طلبات مباشرة فـ WhatsApp',
      ),
    },
  ];

  return (
    <main className="landing">
      {/* 1. EN-TÊTE (HERO) AVEC COMPOSITION VISUELLE 3D FLOTTANTE */}
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

        {/* HERO SHOWCASE 3D: MOCKUP SMARTPHONE + CARTE PHYSIQUE NFC NOIRE & DORÉE */}
        <div className="landing-showcase">
          <div className="showcase-caption">
            <span>{t('VOTRE UNIVERS PROFESSIONNEL EN 1 TAP', 'النشاط ديالك فـ نقرة وحدة')}</span>
            <div className="showcase-pulse-tag">
              <span className="pulse-dot" />
              <span>{t('NFC EN DIRECT', 'NFC مباشرة')}</span>
            </div>
          </div>

          <div className="showcase-composition">
            {/* Mockup Smartphone */}
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
                  address: t('Boulevard d’Anfa, Casablanca', 'شارع أنفا، الدار البيضاء'),
                  website: 'https://soralink.link',
                  googleReview: 'https://g.page/r/soralink/review',
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
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="abg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="face" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fed7aa"/><stop offset="100%" stop-color="%23fba572"/></linearGradient><linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23334155"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="200" height="200" fill="url(%23abg)"/><path d="M52 185c0-28 22-48 48-48s48 20 48 48" fill="%232563eb"/><path d="M85 137l15 22 15-22h-30z" fill="%23ffffff"/><path d="M96 150v35M104 150v35" stroke="%23cbd5e1" stroke-width="2"/><path d="M78 140c-2 18 10 32 22 32s24-14 22-32" stroke="%2338bdf8" stroke-width="3" fill="none"/><circle cx="100" cy="88" r="38" fill="url(%23face)"/><path d="M68 80c0-22 14-36 32-36s32 14 32 36c-6-6-14-10-22-10-8 0-14 4-20 8-8 4-14 2-22 2z" fill="url(%23hair)"/><circle cx="88" cy="85" r="4.5" fill="%231e293b"/><circle cx="112" cy="85" r="4.5" fill="%231e293b"/><path d="M90 102c5 6 15 6 20 0" stroke="%23dc2626" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M93 103c4 3 10 3 14 0" fill="%23ffffff"/></svg>',
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
                      image:
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><defs><linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="400" height="240" fill="url(%23cg1)"/><circle cx="200" cy="120" r="70" fill="%232563eb" opacity="0.2"/><path d="M175 110c0-18 11-30 25-30s25 12 25 30c0 14-8 26-14 36-3 5-8 12-11 12s-8-7-11-12c-6-10-14-22-14-36z" fill="%2338bdf8"/><circle cx="200" cy="115" r="14" fill="%23ffffff"/><text x="200" y="200" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="%2394a3b8" text-anchor="middle">BILAN &amp; DIAGNOSTIC</text></svg>',
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
                      image:
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><defs><linearGradient id="cg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e293b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="400" height="240" fill="url(%23cg2)"/><circle cx="200" cy="120" r="70" fill="%23f59e0b" opacity="0.2"/><path d="M165 130c10 22 60 22 70 0" stroke="%23f59e0b" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M200 85l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" fill="%23fcd34d"/><path d="M165 95l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="%23fcd34d"/><path d="M235 95l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="%23fcd34d"/><text x="200" y="200" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="%2394a3b8" text-anchor="middle">SOURIRE ÉCLATANT</text></svg>',
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
                      image:
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><defs><linearGradient id="pbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2378350f"/><stop offset="100%" stop-color="%231e1307"/></linearGradient></defs><rect width="400" height="240" fill="url(%23pbg)"/><circle cx="200" cy="115" r="55" fill="%23f59e0b" opacity="0.25"/><text x="200" y="132" font-family="system-ui,sans-serif" font-size="48" font-weight="900" fill="%23f59e0b" text-anchor="middle">-20%</text><text x="200" y="180" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="%23fed7aa" text-anchor="middle">PREMIÈRE CONSULTATION</text></svg>',
                      enabled: true,
                    },
                  ],
                }}
                preview
                withSections
              />
            </div>

            {/* Carte NFC physique noire et dorée au premier plan avec onde animée */}
            <div className="showcase-nfc" aria-hidden="true">
              <div className="nfc-pulse-badge">
                <span className="nfc-pulse-ring" />
                <Nfc size={16} />
                <span>{t('Approchez ou scannez', 'قرّب ولا امسح')}</span>
              </div>
              <span dir="ltr">
                SoraLink <Nfc size={22} />
              </span>
              <strong>
                {t('Votre prochain contact\ncommence ici.', 'التواصل الجاي\nكيبدا من هنا.')}
              </strong>
              <div className="nfc-bottom">
                <span>NFC + QR DYNAMIQUE</span>
                <Share2 size={16} />
              </div>
            </div>
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

      {/* 2. POURQUOI SORALINK ? (GRILLE BENTO MODERNE AVEC ICÔNES COLORÉES) */}
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

        <div className="landing-bento-grid">
          {/* Bento 1: Contact & Mini-site */}
          <article className="bento-card bento-card-blue">
            <div className="bento-header">
              <span className="feature-index">01</span>
              <span className="bento-tag bento-tag-blue">
                <Globe size={13} /> {t('MINI-SITE DIGITAL', 'سيت ديجيتال')}
              </span>
            </div>
            <h3>{t('Plus qu’une carte, un mini-site', 'أكثر من كارت فيزيت، سيت كامل')}</h3>
            <p>
              {t(
                'Fiche contact en 1 clic, WhatsApp, réseaux sociaux, localisation Maps, vidéo et document PDF.',
                'تسجيل الكونطاكت بنقرة وحدة، WhatsApp، مواقع التواصل، موقع Maps، فيديو وكتيب PDF.',
              )}
            </p>
            <div className="bento-preview bento-preview-contact">
              <span className="preview-btn preview-btn-primary">
                <Download size={13} /> {t('Ajouter aux contacts', 'حفظ فالكونطاكت')}
              </span>
              <span className="preview-btn preview-btn-whatsapp">
                <WhatsAppIcon /> WhatsApp
              </span>
            </div>
          </article>

          {/* Bento 2: Catalogue & Devis */}
          <article className="bento-card bento-card-amber">
            <div className="bento-header">
              <span className="feature-index">02</span>
              <span className="bento-tag bento-tag-amber">
                <ShoppingBag size={13} /> {t('CATALOGUE & VENTE', 'كاتالوگ وعروض')}
              </span>
            </div>
            <h3>{t('Catalogue & Devis intégrés', 'كاتالوگ وطلبات أثمان مدمجة')}</h3>
            <p>
              {t(
                'Exposez jusqu’à 40 articles avec photo dans les offres payantes, affichez vos promos du moment et recevez des demandes de devis ou commandes directement.',
                'قدّم حتى 40 منتج مع تصويرة فالعروض المؤدى عنها، بيّن عروضك الترويجية واستقبل طلبات الدوڤي ولا الشراء مباشرة.',
              )}
            </p>
            <div className="bento-preview bento-preview-catalogue">
              <div className="bento-mini-thumb">
                <span>🍽️</span>
                <small>{t('Plat & Menu', 'أطباق')}</small>
              </div>
              <div className="bento-mini-thumb">
                <span>✂️</span>
                <small>{t('Coiffure & Soin', 'تجميل')}</small>
              </div>
              <div className="bento-mini-thumb">
                <span>🏗️</span>
                <small>{t('Chantier & Déco', 'أشغال')}</small>
              </div>
              <span className="bento-promo-badge">-20% {t('PROMO', 'تخفيض')}</span>
            </div>
          </article>

          {/* Bento 3: Prise de RDV Option Pro */}
          <article className="bento-card bento-card-indigo">
            <div className="bento-header">
              <span className="feature-index">03</span>
              <span className="bento-tag bento-tag-indigo">
                <Calendar size={13} /> {t('AGENDA EN LIGNE', 'حجز المواعيد')}
              </span>
            </div>
            <h3>{t('Prise de rendez-vous (Option Pro)', 'المواعيد مع Pro')}</h3>
            <p>
              {t(
                'Affichez vos disponibilités et laissez vos clients réserver un créneau dans votre agenda.',
                'بيّن أوقات الخدمة ديالك وخلي الزبناء يحجزو الموعد المناسب فالأجندة ديالك.',
              )}
            </p>
            <div className="bento-preview bento-preview-slots">
              <div className="bento-slot active">
                <Calendar size={12} /> 10:30 · {t('Disponible', 'شاغر')}
              </div>
              <div className="bento-slot">14:00 · {t('Disponible', 'شاغر')}</div>
              <div className="bento-slot confirm">
                <Check size={12} /> {t('Confirmé', 'تم التأكيد')}
              </div>
            </div>
          </article>

          {/* Bento 4: Modifiable à l'infini */}
          <article className="bento-card bento-card-emerald">
            <div className="bento-header">
              <span className="feature-index">04</span>
              <span className="bento-tag bento-tag-emerald">
                <Sparkles size={13} /> {t('ZÉRO RÉIMPRESSION', 'تحديث فوري')}
              </span>
            </div>
            <h3>{t('Modifiable à l’infini', 'تعديل بلا حدود وبلا إعادة طبع')}</h3>
            <p>
              {t(
                'Changez vos prix, votre numéro ou vos offres à tout moment depuis votre téléphone. Votre carte et votre QR code restent les mêmes.',
                'بدّل الأثمنة، النمرة ولا العروض وقتما بغيتي من التلفون ديالك. الكارط والكود QR كيبقاو هما هما.',
              )}
            </p>
            <div className="bento-preview bento-preview-live">
              <span className="live-dot-pulse" />
              <span>
                {t('Mise à jour en direct · 100% synchronisé', 'تحديث مباشر فالحين · 100% متزامن')}
              </span>
            </div>
          </article>
        </div>
      </section>

      {/* 3. COMMENT ÇA MARCHE ? — EN 3 LIGNES AVEC CARTES ÉLÉGANTES */}
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
            <article key={n} className="step-card">
              <span className="step-badge">{n}</span>
              <h3>{t(f, a)}</h3>
              <p>{t(d, dd)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 4. POUR QUI ? — SÉLECTEUR INTERACTIF PAR MÉTIER + BOUTON DÉMO */}
      <section className="landing-examples" id="exemples">
        <div className="landing-heading">
          <span className="landing-kicker">
            {t('POUR TOUS LES PROFESSIONNELS', 'لكل المهنيين')}
          </span>
          <h2>{t('Pour qui ?', 'لمن مخصصة الكارط؟')}</h2>
        </div>

        {/* Sélecteur d'onglets interactif */}
        <div className="persona-tabs" role="tablist">
          {personas.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={activePersona === idx}
              className={`persona-tab-btn ${activePersona === idx ? 'active' : ''}`}
              onClick={() => setActivePersona(idx)}
              style={
                activePersona === idx
                  ? { borderColor: p.badgeColor, color: p.badgeColor }
                  : undefined
              }
            >
              <span>{p.icon}</span>
              <strong>{p.title}</strong>
            </button>
          ))}
        </div>

        {/* Carte showcase dynamique du métier sélectionné */}
        <div className="persona-display-panel">
          <div className="persona-card-active">
            <div className="persona-meta">
              <span
                className="persona-pill"
                style={{
                  backgroundColor: `${personas[activePersona].badgeColor}22`,
                  borderColor: personas[activePersona].badgeColor,
                  color: personas[activePersona].badgeColor,
                }}
              >
                {personas[activePersona].badge}
              </span>
              <h3>
                {personas[activePersona].icon} {personas[activePersona].title}
              </h3>
              <p className="persona-desc">{personas[activePersona].desc}</p>
              <div className="persona-features-row">
                <Check size={16} color={personas[activePersona].badgeColor} />
                <span>{personas[activePersona].highlight}</span>
              </div>
            </div>
            <div className="persona-action">
              <a className="primary" href={'/demo' + (ar ? '?lang=ar' : '')}>
                👉 {t('Explorer ce cas d’usage', 'شوف هاد النموذج')}
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Grille accessible des 4 métiers */}
        <div className="usecase-grid">
          {personas.map((p, idx) => (
            <article
              key={p.id}
              className={`usecase-card ${activePersona === idx ? 'active' : ''}`}
              onClick={() => setActivePersona(idx)}
              style={{ cursor: 'pointer' }}
            >
              <span className="usecase-icon">{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </article>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <a className="landing-link" href={'/demo' + (ar ? '?lang=ar' : '')}>
            👉 {t('Explorer une carte de démonstration complète', 'شوف مثال كامل ديال الكارط')}
            <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* 5. LES OFFRES — CLAIRES, ORIENTÉES VALEUR AVEC PACK HYBRIDE MIS EN RELIEF */}
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
          {/* 1. Digital */}
          <article className="pricing-card">
            <span className="eyebrow">
              {t('L’essentiel 100 % en ligne', 'الأساسي 100% أونلاين')}
            </span>
            <h3>{t('Digital', 'الديجيتال')}</h3>
            <strong className="landing-price">
              149<small> {t('DH', 'درهم')}</small>
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
            <a className="secondary full" href={signupPath(ar, 'Digital', auth)}>
              {t('Choisir Digital', 'اختار الديجيتال')}
            </a>
            <small>{t('Renouvellement : 149 DH/an', 'التجديد: 149 درهم فالعام')}</small>
          </article>

          {/* 2. Pack Hybride - Mis en relief (Bleu Nuit #0F172A, scale, bordure lumineuse, badge 🔥) */}
          <article className="pricing-card featured pack-hybride-highlight">
            <div className="floating-highlight-badge">
              <span>🔥 {t('LE PLUS CHOISI · 349 DH', 'الأكثر طلباً · 349 درهم')}</span>
            </div>

            <span className="eyebrow">{t('⭐ Le plus populaire', '⭐ الأكثر طلباً')}</span>
            <h3>{t('Pack Hybride', 'الپاك الهجين')}</h3>
            <div className="landing-price-tagline">
              {t(
                'Le moderne + le classique pour ne rater aucun client',
                'العصري والتقليدي باش ما تضيع حتى زبون',
              )}
            </div>

            <div className="pack-hardware-preview">
              <div className="hardware-pill">
                <Nfc size={15} /> {t('1 Carte NFC', 'كارط NFC وحدة')}
              </div>
              <div className="hardware-pill">
                <Layers size={15} /> {t('100 Cartes papier QR', '100 كارط ورقية QR')}
              </div>
            </div>

            <strong className="landing-price">
              349<small> {t('DH', 'درهم')}</small>
            </strong>
            <p className="hint">{t('la première année', 'فالعام الأول')}</p>

            <ul className="landing-price-features">
              <li>
                <Check size={16} />
                <span>
                  <strong>
                    {t('Tout le forfait Digital inclus (1 an)', 'كل ما في باقة الديجيتال (1 عام)')}
                  </strong>
                </span>
              </li>
              <li>
                <Check size={16} />
                <span>
                  <strong>
                    {t(
                      '+ 1 Carte NFC personnalisée à votre image',
                      '+ 1 كارط NFC مخصصة بالهوية ديالك',
                    )}
                  </strong>
                </span>
              </li>
              <li>
                <Check size={16} />
                <span>
                  <strong>
                    {t(
                      '+ 100 Cartes papier imprimées avec votre QR code',
                      '+ 100 كارت فيزيت مطبوعة بالـ QR ديالك',
                    )}
                  </strong>
                </span>
              </li>
            </ul>

            <a className="primary full btn-glow-gold" href={signupPath(ar, 'Pack', auth)}>
              {t('Choisir le Pack', 'اختار هاد الپاك')}
            </a>
            <small>
              {t(
                'Renouvellement l’année suivante : 149 DH/an',
                'التجديد فالعام الموالي: 149 درهم فالعام',
              )}
            </small>
          </article>

          {/* 3. Clé en main */}
          <article className="pricing-card">
            <span className="eyebrow">
              {t('On s’occupe de tout pour vous', 'كنتكلفو ليك بكلشي')}
            </span>
            <h3>{t('Clé en main', 'خدمة كاملة')}</h3>
            <div className="landing-price-tagline">
              {t('Accompagnement VIP', 'مرافقة VIP خاصة')}
            </div>
            <strong className="landing-price">
              549<small> {t('DH', 'درهم')}</small>
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
            <a className="secondary full" href={signupPath(ar, 'Accompagnement', auth)}>
              {t('Choisir Clé en main', 'اختار الخدمة الكاملة')}
            </a>
            <small>
              {t(
                'Renouvellement l’année suivante : 149 DH/an',
                'التجديد فالعام الموالي: 149 درهم فالعام',
              )}
            </small>
          </article>
        </div>

        {/* 5E OFFRE : CARTES SPÉCIALES COLORÉES PAR USAGE */}
        <div className="landing-special-offer">
          <div className="special-offer-header">
            <div>
              <span className="special-offer-badge">
                {t('🎯 USAGE UNIQUE & SUR-MESURE', '🎯 استعمال مباشر وعلى المقاس')}
              </span>
              <h3>
                {t(
                  'Cartes Spéciales (Usage unique) — À partir de 149 DH',
                  'كارتات خاصة (استعمال مباشر) — ابتداءً من 149 درهم',
                )}
              </h3>
              <p>
                {t(
                  'Un besoin précis ? Une carte NFC + QR dédiée à une seule action immédiate, sans abonnement obligatoire.',
                  'عندك غرض محدد؟ كارط NFC وQR مخصصة لحركة وحدة ومباشرة، بلا اشتراك إجباري.',
                )}
              </p>
            </div>
            <a
              className="whatsapp-btn-glow"
              href={`https://wa.me/212661446664?text=${encodeURIComponent(
                t(
                  'Bonjour SoraLink, je souhaite commander une carte spéciale sur-mesure (Avis Google, Menu, Santé, etc.). Pouvez-vous me renseigner ?',
                  'السلام عليكم SoraLink، بغيت نطلب كارط خاصة على المقاس (تقييمات Google، مينو، صحة، إلخ). ممكن معلومات؟',
                ),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Demander ma carte spéciale sur WhatsApp', 'طلب الكارط الخاصة فـ WhatsApp')}
              <WhatsAppIcon />
            </a>
          </div>

          <div className="special-offer-grid">
            {/* Carte Avis Google : Dégradé Jaune/Or + 5 étoiles + Google */}
            <div className="special-offer-item special-card-google">
              <div className="special-icon-box google-box">
                <Star size={24} className="star-gold" />
              </div>
              <div>
                <div className="special-card-badge-row">
                  <h4>{t('Carte Avis Google & Réseaux', 'كارط تقييمات Google والمواقع')}</h4>
                  <span className="stars-five">★★★★★</span>
                </div>
                <p>
                  {t(
                    'Posez-la sur votre comptoir ou présentez-la à vos clients pour récolter des avis 5 étoiles ou des abonnés Instagram/TikTok en 3 secondes.',
                    'حطها فالكونطوار ولا قدّمها للزبناء باش تجمع تقييمات 5 نجوم ومتابعين Instagram/TikTok فـ 3 ثواني.',
                  )}
                </p>
              </div>
            </div>

            {/* Carte Menu : Fond Terracotta/Orange + icône couvert / menu */}
            <div className="special-offer-item special-card-menu">
              <div className="special-icon-box menu-box">
                <Utensils size={24} className="cutlery-icon" />
              </div>
              <div>
                <div className="special-card-badge-row">
                  <h4>{t('Carte Menu & Catalogue', 'كارط المينو والكاتالوگ')}</h4>
                  <span className="mini-badge-pill">{t('Café & Resto', 'قهوة ومطعم')}</span>
                </div>
                <p>
                  {t(
                    'Idéale sur les tables de cafés, restaurants et salons pour afficher votre carte PDF ou vos tarifs sans réimprimer.',
                    'مثالية لطبلات القهاوي، المطاعم والصالونات باش تبين المينو PDF ولا الأثمنة بلا ما تعاود تطبع.',
                  )}
                </p>
              </div>
            </div>

            {/* Carte Santé : Fond Vert Médical / Corail + icône cœur/croix */}
            <div className="special-offer-item special-card-health">
              <div className="special-icon-box health-box">
                <Heart size={24} className="health-icon" />
              </div>
              <div>
                <div className="special-card-badge-row">
                  <h4>{t('Carte Santé & Urgence', 'كارط الصحة والطوارئ')}</h4>
                  <span className="mini-badge-pill medical-pill">
                    {t('Urgence & SOS', 'طوارئ')}
                  </span>
                </div>
                <p>
                  {t(
                    'Groupe sanguin, allergies, traitements et contacts d’urgence accessibles par simple scan en cas de besoin (idéal enfants, seniors, sportifs).',
                    'فصيلة الدم، الحساسية، الأدوية ومعلومات الطوارئ بمسحة وحدة (للأطفال، الكبار والرياضيين).',
                  )}
                </p>
              </div>
            </div>

            {/* Carte Sur-mesure : Fond Violet/Indigo + Wi-Fi */}
            <div className="special-offer-item special-card-custom">
              <div className="special-icon-box custom-box">
                <Wifi size={24} className="wifi-icon" />
              </div>
              <div>
                <div className="special-card-badge-row">
                  <h4>{t('Autre besoin sur mesure', 'أي طلب خاص على المقاس')}</h4>
                  <span className="mini-badge-pill custom-pill">{t('100% Modulable', 'مرن')}</span>
                </div>
                <p>
                  {t(
                    'Partage Wi-Fi, badge événementiel, lien unique... Nous adaptons le support à votre usage.',
                    'مشاركة الويفي Wi-Fi، بادج للمناسبات، رابط مباشر... كنصايبو الدعم اللي يناسبك.',
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="special-offer-footer">
            <span className="special-tag">
              ✨{' '}
              {t(
                'Disponible en format carte PVC, sticker NFC de table ou chevalet de comptoir.',
                'متوفرة فشكل كارط PVC، ستيكر NFC للطبلة ولا حامل للكونطوار.',
              )}
            </span>
          </div>
        </div>

        <div className="pricing-notes">
          <p>
            <Calendar size={18} />
            <strong>
              {t('Option Pro (Rendez-vous) : +250 DH / an', 'خيار Pro للمواعيد: +250 درهم فالعام')}
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

      {/* 7. APPEL À L'ACTION FINAL (BAS DE PAGE) AVEC OMBRES ET COULEURS VIBRANTES */}
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
            className="primary btn-glow"
            href={auth ? '/?app=1' : '/auth?mode=signup' + (ar ? '&lang=ar' : '')}
          >
            {t('Créer ma carte', 'صايب الكارط ديالي')}
            <Plus size={18} />
          </a>
          <a
            className="whatsapp-btn-glow"
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
