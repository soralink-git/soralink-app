'use client';
import { Check, Nfc, Sparkles } from 'lucide-react';
import { offers } from './lib/offers';
import { signupPath } from './lib/journey-links';
import { WhatsAppIcon } from './card-helpers';

const packWaMessages: Record<string, [string, string]> = {
  Identite: [
    'Bonjour SoraLink, je souhaite commander le Pack 2 (E-Identité à 149 DH) pour mon activité.',
    'السلام عليكم، بغيت نطلب باقة 2 (الهوية الرقمية بـ 149 درهم) للنشاط ديالي.',
  ],
  Catalogue: [
    'Bonjour SoraLink, je souhaite commander le Pack 3 (Produits et services à 249 DH) pour mon activité.',
    'السلام عليكم، بغيت نطلب باقة 3 (المنتجات والخدمات بـ 249 درهم) للنشاط ديالي.',
  ],
  Activite: [
    'Bonjour SoraLink, je souhaite commander le Pack 4 (Suivi de mon activité à 499 DH) pour mon activité.',
    'السلام عليكم، بغيت نطلب باقة 4 (تتبع النشاط بـ 499 درهم) للنشاط ديالي.',
  ],
};

export default function OfferGrid({ ar, auth }: { ar: boolean; auth: boolean }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  return (
    <>
      <article className="single-action-offer">
        <div>
          <span className="eyebrow">
            {t('PACK 1 · CARTE NFC PHYSIQUE', 'الباقة 1 · بطاقة NFC مادية')}
          </span>
          <h3>
            <Nfc size={22} /> {t('Une carte, une action', 'كارط وحدة، إجراء واحد')}
          </h3>
          <p>
            {t(
              'Carte NFC physique incluse · 1 action directe au choix (Avis Google, WhatsApp, appel direct ou réseau social). Sans abonnement obligatoire, sans compte.',
              'بطاقة NFC مادية متضمنة · إجراء مباشر واحد من اختيارك (تقييم Google، WhatsApp، اتصال أو موقع تواصل). بدون اشتراك وبدون حساب.',
            )}
          </p>
        </div>
        <div className="single-action-price">
          <strong className="landing-price">
            99<small> {t('DH', 'درهم')}</small>
          </strong>
          <small>{t('Paiement unique · livraison séparée', 'أداء مرة وحدة · التوصيل بوحدو')}</small>
          <a
            className="secondary offer-wa-btn"
            target="_blank"
            rel="noopener noreferrer"
            href={
              'https://wa.me/212661446664?text=' +
              encodeURIComponent(
                t(
                  'Bonjour SoraLink, je souhaite commander le Pack 1 (Carte NFC à 99 DH) pour mon activité.',
                  'السلام عليكم، بغيت نطلب باقة 1 (كارط NFC بـ 99 درهم) للنشاط ديالي.',
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
        {offers.map((offer) => {
          const isFeatured = offer.id === 'Catalogue';
          const waText = packWaMessages[offer.id] || [
            `Bonjour SoraLink, je souhaite commander le Pack ${offer.number} (${offer.name[0]} à ${offer.price} DH).`,
            `السلام عليكم، بغيت نطلب باقة ${offer.number} (${offer.name[1]} بـ ${offer.price} درهم).`,
          ];
          return (
            <article key={offer.id} className={'pricing-card' + (isFeatured ? ' featured' : '')}>
              {isFeatured && (
                <div className="pricing-badge" aria-label="Pack recommandé">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>
                    {t('★ LE PLUS CHOISI PAR LES PROS', '★ الأكثر اختياراً من المحترفين')}
                  </span>
                </div>
              )}
              <span className="eyebrow">
                {t('PACK', 'الباقة')} {offer.number}
              </span>
              <h3>{offer.name[ar ? 1 : 0]}</h3>
              <strong className="landing-price">
                {offer.price}
                <small> {t('DH', 'درهم')}</small>
              </strong>
              {isFeatured ? (
                <span className="pricing-monthly-anchor">
                  {t(
                    'Soit moins de 21 DH/mois la première année',
                    'يعني أقل من 21 درهم فالشهر فالعام الأول',
                  )}
                </span>
              ) : (
                <p className="hint">{t('Première année incluse', 'العام الأول داخل فالثمن')}</p>
              )}
              <ul className="landing-price-features">
                {offer.features.map((feature) => (
                  <li key={feature[0]}>
                    <Check size={16} />
                    <span>{feature[ar ? 1 : 0]}</span>
                  </li>
                ))}
                {offer.id === 'Identite' && (
                  <li className="feature-option">
                    <Check size={16} />
                    <span>
                      <em>
                        {t('Option Carte NFC physique disponible', 'إمكانية إضافة بطاقة NFC مادية')}
                      </em>
                    </span>
                  </li>
                )}
                {isFeatured && (
                  <li className="feature-option">
                    <Check size={16} />
                    <span>
                      <em>
                        {t(
                          'Option Carte NFC personnalisée disponible',
                          'إمكانية إضافة بطاقة NFC مخصصة',
                        )}
                      </em>
                    </span>
                  </li>
                )}
                {offer.id === 'Activite' && (
                  <li className="feature-option">
                    <Check size={16} />
                    <span>
                      <em>
                        {t(
                          'Option Carte NFC personnalisée disponible',
                          'إمكانية إضافة بطاقة NFC مخصصة',
                        )}
                      </em>
                    </span>
                  </li>
                )}
              </ul>
              <a
                className={(isFeatured ? 'primary' : 'secondary') + ' full offer-wa-btn'}
                target="_blank"
                rel="noopener noreferrer"
                href={
                  'https://wa.me/212661446664?text=' + encodeURIComponent(t(waText[0], waText[1]))
                }
              >
                <WhatsAppIcon />
                <span>{t('Commander sur WhatsApp', 'طلب عبر WhatsApp')}</span>
              </a>
              <a className="offer-signup-link" href={signupPath(ar, offer.id, auth)}>
                {t('Ou configurer directement en ligne →', 'أو إعداد الحساب أونلاين ←')}
              </a>
              <small>
                {t(
                  'Puis 149 DH/an, toutes les fonctions de votre pack conservées.',
                  'من بعد 149 درهم فالعام، مع الاحتفاظ بجميع وظائف الباقة ديالك.',
                )}
              </small>
            </article>
          );
        })}
      </div>
      <p className="offer-terms">
        {t(
          'Option Carte NFC physique personnalisée disponible pour les Packs 2, 3 et 4 (tarif préférentiel à la commande). Hébergement et modifications illimitées inclus pendant l’abonnement. Paiement manuel par virement ou espèces, sans prélèvement automatique.',
          'إمكانية طلب بطاقة NFC مادية مخصصة للباقات 2، 3 و4 (بثمن تفضيلي عند الطلب). الاستضافة وتعديل المحتوى متضمنان خلال الاشتراك. الأداء يدوي بالتحويل البنكي أو نقداً، وبدون أي اقتطاع تلقائي.',
        )}
      </p>
    </>
  );
}
