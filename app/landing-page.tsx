'use client';
import { signupPath } from './lib/journey-links';
import { demoCard, demoCardArabic } from './lib/demo-card';
import type { ComponentType } from 'react';
import {
  Calendar,
  Check,
  ExternalLink,
  Layers,
  Nfc,
  Plus,
  Share2,
  Users,
  ShoppingBag,
  RefreshCw,
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
            <a
              className="primary"
              href={auth ? '/?app=1' : '/auth?mode=signup' + (ar ? '&lang=ar' : '')}
            >
              {auth
                ? t('Ouvrir mon espace', 'ندخل للمساحة ديالي')
                : t('Créer ma carte', 'صايب الكارط ديالي')}
              <Plus size={18} />
            </a>
            <a className="landing-link" href={'/demo' + (ar ? '?lang=ar' : '')}>
              {t('Voir un exemple', 'شوف مثال')}
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
        <div className="landing-showcase" id="exemples">
          <div className="showcase-caption">{t('UNE PAGE À VOTRE IMAGE', 'صفحة على ذوقك')}</div>
          <div className="showcase-composition">
            <div className="showcase-phone">
              <div className="phone-notch">
                <span className="phone-speaker" />
              </div>
              <Card d={{ ...blank, ...(ar ? demoCardArabic : demoCard) }} preview withSections />
            </div>
            <div className="showcase-nfc" aria-hidden="true">
              <div className="nfc-pulse-badge">
                <Nfc size={16} />
                <span>{t('Approchez ou scannez', 'قرّب ولا امسح')}</span>
              </div>
              <span dir="ltr">
                SoraLink <Nfc size={22} />
              </span>
              <strong>
                {t('Votre activité,\nà portée de main.', 'النشاط ديالك،\nديما معاك.')}
              </strong>
              <div className="nfc-bottom">
                <span>{t('NFC + QR CODE', 'NFC وكود QR')}</span>
                <Share2 size={16} />
              </div>
            </div>
          </div>
          <div className="showcase-note">
            {t(
              'Profil de démonstration · Personnalisable pour votre activité',
              'بروفايل للتوضيح · كتخصّصو حسب النشاط ديالك',
            )}
          </div>
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
              <span>{t('LE PACK COMPLET', 'الپاك الكامل')}</span>
            </div>

            <span className="eyebrow">
              {t('Digital + supports imprimés', 'ديجيتال وكارطات مطبوعة')}
            </span>
            <h3>{t('Pack Hybride', 'الپاك الهجين')}</h3>
            <div className="landing-price-tagline">
              {t(
                'Votre page, votre carte NFC et vos cartes papier.',
                'صفحتك، كارط NFC والكارطات الورقية ديالك.',
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
              {t('Nous créons votre page pour vous.', 'كنصايبو الصفحة ليك.')}
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

        <details className="landing-more">
          <summary>{t('Un besoin sur mesure ?', 'بغيتي حاجة على المقاس؟')}</summary>
          <p>
            {t(
              'Une carte NFC pour un lien ou une action précise : contactez-nous pour en parler.',
              'كارط NFC لرابط ولا إجراء محدد: تواصل معانا باش نشوفو الطلب ديالك.',
            )}
          </p>
          <a
            className="landing-link"
            href="https://wa.me/212661446664"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('Nous contacter sur WhatsApp', 'تواصل معانا فـ WhatsApp')} <WhatsAppIcon />
          </a>
        </details>

        <details className="pricing-notes landing-more">
          <summary>{t('Rendez-vous et détails des offres', 'المواعيد وتفاصيل العروض')}</summary>
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
        </details>
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
