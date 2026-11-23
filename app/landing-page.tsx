'use client';
/* Local WebP assets are pre-optimized; native images preserve triptych geometry. */
/* eslint-disable @next/next/no-img-element */
import './landing-visual.css';
import { ArrowUpRight, Play } from 'lucide-react';
import { WhatsAppIcon } from './card-helpers';
import LandingExamples from './landing-examples';
import LandingOffers from './landing-offers';

export default function LandingPage({ ar, auth }: { ar: boolean; auth: boolean }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const demo = '/demo' + (ar ? '?lang=ar' : '');
  const order =
    'https://wa.me/212661446664?text=' +
    encodeURIComponent(
      t(
        'Bonjour, je souhaite commander une carte SoraLink NFC pour mon activité.',
        'السلام عليكم، بغيت نطلب كارط SoraLink NFC للنشاط ديالي.',
      ),
    );
  return (
    <main id="main-content" tabIndex={-1} className="landing landing-visual">
      <section className="visual-hero" aria-labelledby="visual-title">
        <img
          className="visual-hero-image"
          src="/landing/hero.webp"
          width="1536"
          height="1024"
          fetchPriority="high"
          alt={t(
            'La carte NFC noire SoraLink et sa page digitale sur smartphone.',
            'كارط SoraLink كحلة بتقنية NFC والصفحة الرقمية ديالها فالتلفون.',
          )}
        />
        <div className="visual-hero-copy">
          <h1 id="visual-title">
            {t('Votre activité,', 'النشاط ديالك،')}
            <br />
            <em>{t('en un geste.', 'بحركة وحدة.')}</em>
          </h1>
          <p>
            {t(
              'Votre contact, vos offres et votre localisation. Un seul lien.',
              'معلومات التواصل، العروض والموقع ديالك. فرابط واحد.',
            )}
          </p>
          <div className="landing-actions">
            <a className="primary" href={order} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              {t('Commander sur WhatsApp', 'طلب عبر WhatsApp')}
            </a>
            <a className="secondary" href={demo}>
              <Play size={18} />
              {t('Essayer la démo', 'جرّب المثال')}
            </a>
          </div>
          <p className="visual-hero-note">
            {t('NFC · QR code · Sans application', 'NFC · رمز QR · بلا تطبيق')}
          </p>
        </div>
      </section>

      <section
        className="visual-section visual-steps"
        id="fonctionnalites"
        aria-labelledby="steps-title"
      >
        <h2 id="steps-title">{t('Un geste suffit.', 'حركة وحدة كافية.')}</h2>
        <div className="visual-step-grid">
          {[
            [
              'Approchez',
              'قرّب الكارط',
              'Approchez la carte SoraLink du téléphone.',
              'قرّب كارط SoraLink للتلفون.',
            ],
            [
              'Découvrez',
              'اكتشف الصفحة',
              'Votre page professionnelle s’ouvre sur le smartphone.',
              'الصفحة المهنية ديالك كتحل فالتلفون.',
            ],
            [
              'Enregistrez',
              'سجّل التواصل',
              'Enregistrez le contact SoraLink au Maroc : +212 661 446 664.',
              'سجّل معلومات SoraLink فالمغرب: +212 661 446 664.',
            ],
          ].map(([fr, da, alt, altAr], i) => (
            <figure key={fr}>
              <div className="visual-triptych" dir="ltr">
                <img
                  src="/landing/gestures.webp"
                  width="2172"
                  height="724"
                  loading="lazy"
                  alt={t(alt, altAr)}
                  style={{ transform: 'translateX(-' + (i * 100) / 3 + '%)' }}
                />
              </div>
              <figcaption>{t(fr, da)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <LandingExamples ar={ar} />

      <section className="visual-section visual-pricing" id="tarifs" aria-labelledby="offers-title">
        <h2 id="offers-title">{t('Une offre pour votre activité.', 'عرض مناسب للنشاط ديالك.')}</h2>
        <LandingOffers ar={ar} auth={auth} />
      </section>

      <section className="visual-section visual-faq" id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">{t('Vos questions, simplement.', 'أجوبة واضحة لأسئلتك.')}</h2>
        <div className="visual-faq-list">
          {[
            [
              'Faut-il installer une application ?',
              'واش خاص شي تطبيق؟',
              'Non. Votre client approche la carte d’un téléphone compatible NFC ou scanne son QR code.',
              'لا. الزبون كيقرّب الكارط لتلفون متوافق مع NFC ولا كيمسح رمز QR.',
            ],
            [
              'Puis-je modifier ma page ?',
              'واش نقدر نبدّل الصفحة ديالي؟',
              'Oui, avec les packs 2 à 4 pendant votre abonnement. Le lien reste identique. Le pack 1 ouvre une action directe choisie à la commande.',
              'إيه، فالباقات 2 حتى 4 خلال الاشتراك، والرابط كيبقى هو هو. الباقة 1 كتحل مباشرة الإجراء اللي اخترتي فالطلب.',
            ],
            [
              'Comment commander ?',
              'كيفاش نطلب؟',
              'Choisissez votre pack puis contactez-nous sur WhatsApp. Nous confirmons le visuel, le paiement par virement ou espèces et les frais et délais de livraison.',
              'اختار الباقة وتواصل معانا فـ WhatsApp. كنأكدو التصميم، الأداء بالتحويل أو كاش، وثمن ومدة التوصيل.',
            ],
            [
              'Que comprend le renouvellement ?',
              'شنو كيشمل التجديد؟',
              'Les packs 2 à 4 se renouvellent à 149 DH/an, avec toutes les fonctions de votre pack, l’hébergement et les modifications. Aucun prélèvement automatique. Le pack 1 est sans abonnement.',
              'الباقات 2 حتى 4 كتتجدد بـ149 درهم فالعام، بجميع الوظائف والاستضافة والتعديلات. بلا اقتطاع تلقائي. الباقة 1 بلا اشتراك.',
            ],
          ].map(([q, qa, a, aa]) => (
            <details key={q}>
              <summary>{t(q, qa)}</summary>
              <p>{t(a, aa)}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="visual-final">
        <h2>{t('Prêt à partager votre activité ?', 'واجد تشارك النشاط ديالك؟')}</h2>
        <a className="secondary" href={order} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          {t('Parlons sur WhatsApp', 'نهضرو فـ WhatsApp')}
          <ArrowUpRight size={18} />
        </a>
      </section>
    </main>
  );
}
