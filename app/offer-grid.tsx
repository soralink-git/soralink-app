'use client';
import { Check, Nfc } from 'lucide-react';
import { offers } from './lib/offers';
import { signupPath } from './lib/journey-links';
import { WhatsAppIcon } from './card-helpers';
export default function OfferGrid({ ar, auth }: { ar: boolean; auth: boolean }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  return (
    <>
      <article className="single-action-offer">
        <div>
          <span className="eyebrow">{t('PACK 1 · CARTE NFC', 'الباقة 1 · كارط NFC')}</span>
          <h3>
            <Nfc size={22} /> {t('Une carte, une action', 'كارط وحدة، إجراء واحد')}
          </h3>
          <p>
            {t(
              'Avis Google, WhatsApp, réseau social ou lien direct. Sans compte SoraLink, sans abonnement.',
              'تقييم Google، WhatsApp، موقع تواصل ولا رابط مباشر. بلا حساب SoraLink وبلا اشتراك.',
            )}
          </p>
        </div>
        <div className="single-action-price">
          <strong className="landing-price">
            99<small> {t('DH', 'درهم')}</small>
          </strong>
          <small>{t('Paiement unique · livraison séparée', 'أداء مرة وحدة · التوصيل بوحدو')}</small>
          <a
            className="secondary"
            target="_blank"
            rel="noopener noreferrer"
            href={
              'https://wa.me/212661446664?text=' +
              encodeURIComponent(
                t(
                  'Bonjour, je souhaite commander le pack Une carte, une action à 99 DH. Ma destination : ',
                  'السلام عليكم، بغيت باقة كارط وحدة، إجراء واحد بـ99 درهم. الرابط ديالي: ',
                ),
              )
            }
          >
            <WhatsAppIcon />
            {t('Commander sur WhatsApp', 'طلب عبر WhatsApp')}
          </a>
        </div>
      </article>
      <div className="landing-price-grid">
        {offers.map((offer) => (
          <article
            key={offer.id}
            className={'pricing-card' + (offer.id === 'Catalogue' ? ' featured' : '')}
          >
            <span className="eyebrow">
              {t('PACK', 'الباقة')} {offer.number}
            </span>
            <h3>{offer.name[ar ? 1 : 0]}</h3>
            <strong className="landing-price">
              {offer.price}
              <small> {t('DH', 'درهم')}</small>
            </strong>
            <p className="hint">{t('Première année incluse', 'العام الأول داخل فالثمن')}</p>
            <ul className="landing-price-features">
              {offer.features.map((feature) => (
                <li key={feature[0]}>
                  <Check size={16} />
                  <span>{feature[ar ? 1 : 0]}</span>
                </li>
              ))}
            </ul>
            <a
              className={(offer.id === 'Catalogue' ? 'primary' : 'secondary') + ' full'}
              href={signupPath(ar, offer.id, auth)}
            >
              {t('Choisir ce pack', 'اختار هاد الباقة')}
            </a>
            <small>
              {t(
                'Puis 149 DH/an, toutes les fonctions de votre pack conservées.',
                'من بعد 149 درهم فالعام، مع الاحتفاظ بجميع وظائف الباقة ديالك.',
              )}
            </small>
          </article>
        ))}
      </div>
      <p className="offer-terms">
        {t(
          'Packs 2, 3 et 4 : modifications de vos contenus et hébergement inclus pendant l’abonnement. Carte NFC physique en supplément. Paiement manuel, sans prélèvement automatique.',
          'الباقات 2 و3 و4: تعديل المحتوى والاستضافة داخلين فالاشتراك. كارط NFC المادية بزيادة. الأداء يدوي وبلا اقتطاع أوتوماتيكي.',
        )}
      </p>
    </>
  );
}
