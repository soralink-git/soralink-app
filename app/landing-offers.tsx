'use client';
/* Local WebP assets are pre-optimized; native images preserve triptych geometry. */
/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { offers, RENEWAL_PRICE } from './lib/offers';
import { signupPath } from './lib/journey-links';
import { WhatsAppIcon } from './card-helpers';

export default function LandingOffers({ ar, auth }: { ar: boolean; auth: boolean }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  const packs = [
    {
      id: 'Carte',
      number: 1,
      price: 99,
      name: ['Carte NFC', 'كارط NFC'],
      features: [
        ['Une action directe au choix', 'إجراء مباشر من اختيارك'],
        ['Carte physique incluse', 'الكارط المادية متضمنة'],
        ['Sans compte ni abonnement', 'بلا حساب وبلا اشتراك'],
      ],
    },
    ...offers,
  ];
  const titles = [
    ['Carte NFC', 'كارط NFC'],
    ['Identité', 'الهوية الرقمية'],
    ['Catalogue', 'الكاتالوگ'],
    ['Activité', 'تتبّع النشاط'],
  ];
  return (
    <>
      <div className="visual-offer-grid">
        {packs.map((pack, i) => (
          <article className="visual-offer" key={pack.id}>
            <div className="visual-offer-photo">
              {i === 0 ? (
                <img
                  src="/landing/hero.webp"
                  width="1536"
                  height="1024"
                  loading="lazy"
                  alt={t('Carte NFC noire SoraLink', 'كارط NFC كحلة SoraLink')}
                />
              ) : (
                <div className="visual-triptych" dir="ltr">
                  <img
                    src="/landing/activities.webp"
                    width="2172"
                    height="724"
                    loading="lazy"
                    alt=""
                    style={{ transform: 'translateX(-' + ((i - 1) * 100) / 3 + '%)' }}
                  />
                </div>
              )}
              {i === 3 && (
                <span className="visual-offer-icon" aria-hidden="true">
                  <CalendarDays size={24} />
                </span>
              )}
            </div>
            <div className="visual-offer-body">
              <span className="visual-pack-number">
                {t('Pack ', 'الباقة ')}
                {pack.number}
              </span>
              <h3>{titles[i][ar ? 1 : 0]}</h3>
              <strong className="visual-offer-price">
                {pack.price}
                <small>{t('DH', 'درهم')}</small>
              </strong>
              <p className="visual-offer-period">
                {i === 0
                  ? t('Paiement unique · sans abonnement', 'أداء مرة وحدة · بلا اشتراك')
                  : t('Première année incluse', 'العام الأول داخل فالثمن')}
              </p>
              {i > 0 && (
                <p className="visual-renewal">
                  {t(
                    'Puis ' + RENEWAL_PRICE + ' DH/an',
                    'من بعد ' + RENEWAL_PRICE + ' درهم فالعام',
                  )}
                </p>
              )}
              <details>
                <summary>{t('Voir les détails', 'شوف التفاصيل')}</summary>
                <ul>
                  {pack.features.map(([fr, da]) => (
                    <li key={fr}>{t(fr, da)}</li>
                  ))}
                </ul>
                <p>
                  {i === 0
                    ? t('Livraison facturée séparément.', 'التوصيل كيتحسب بوحدو.')
                    : t(
                        'Carte NFC physique en option, tarif confirmé à la commande. Toutes les fonctions de votre pack sont conservées au renouvellement.',
                        'الكارط المادية اختيارية، الثمن كيتأكد فالطلب. جميع الوظائف كتبقى من بعد التجديد.',
                      )}
                </p>
              </details>
              <a
                className="primary"
                href={
                  'https://wa.me/212661446664?text=' +
                  encodeURIComponent(
                    t(
                      'Bonjour SoraLink, je souhaite commander le Pack ' +
                        pack.number +
                        ' (' +
                        pack.name[0] +
                        ' à ' +
                        pack.price +
                        ' DH).',
                      'السلام عليكم، بغيت نطلب الباقة ' +
                        pack.number +
                        ' (' +
                        pack.name[1] +
                        ' بـ ' +
                        pack.price +
                        ' درهم).',
                    ),
                  )
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <WhatsAppIcon />
                {t('Commander', 'نطلب الباقة')}
              </a>
              {i > 0 && (
                <a className="visual-configure" href={signupPath(ar, pack.id, auth)}>
                  {t('Configurer ma carte', 'نوجد الكارط ديالي')}
                  <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="visual-offer-terms">
        {t(
          'Carte physique incluse dans le pack 1, en option dans les packs 2 à 4. Paiement par virement ou espèces, sans prélèvement automatique.',
          'الكارط المادية داخلة فالباقة 1، واختيارية فالباقات 2 حتى 4. الأداء بالتحويل أو كاش، بلا اقتطاع تلقائي.',
        )}
      </p>
    </>
  );
}
