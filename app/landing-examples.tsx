'use client';
/* Local WebP assets are pre-optimized; native images preserve triptych geometry. */
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { UserRound, MapPin, Phone, CalendarDays, ArrowUpRight } from 'lucide-react';
import { WhatsAppIcon } from './card-helpers';

export default function LandingExamples({ ar }: { ar: boolean }) {
  const [selected, setSelected] = useState(0);
  const t = (fr: string, da: string) => (ar ? da : fr);
  const labels = [
    ['Professionnel', 'مهني'],
    ['Boutique', 'متجر'],
    ['Restaurant', 'مطعم'],
  ];
  const demo = '/demo' + (ar ? '?lang=ar' : '');
  return (
    <section
      className="visual-section visual-examples"
      id="exemples"
      aria-labelledby="examples-title"
    >
      <h2 id="examples-title">{t('À chaque activité, sa page.', 'لكل نشاط، الصفحة ديالو.')}</h2>
      <div
        className="visual-example-selector"
        role="group"
        aria-label={t('Choisir un exemple', 'اختار مثال')}
      >
        {labels.map(([fr, da], i) => (
          <button
            key={fr}
            type="button"
            className={selected === i ? 'selected' : ''}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
          >
            {t(fr, da)}
          </button>
        ))}
      </div>
      <div className="visual-phone-grid">
        {labels.map(([fr, da], i) => (
          <article
            key={fr}
            className={'visual-phone' + (selected === i ? ' selected' : '')}
            aria-label={t('Exemple : ' + fr, 'مثال: ' + da)}
          >
            <div className="visual-phone-notch" aria-hidden="true" />
            <div className="visual-phone-brand">
              <img src="/favicon.svg" width="22" height="22" alt="" />
              SoraLink
            </div>
            <div className="visual-triptych visual-phone-cover" dir="ltr">
              <img
                src="/landing/activities.webp"
                width="2172"
                height="724"
                loading="lazy"
                alt={t(
                  [
                    'Bureau professionnel',
                    'Casque audio en boutique',
                    'Cuisine marocaine au restaurant',
                  ][i],
                  ['مكتب مهني', 'سماعات فالمتجر', 'المطبخ المغربي فالمطعم'][i],
                )}
                style={{ transform: 'translateX(-' + (i * 100) / 3 + '%)' }}
              />
            </div>
            <div className="visual-phone-body">
              <h3>{t(fr, da)}</h3>
              <div className="visual-phone-actions" aria-hidden="true">
                <span>
                  <UserRound size={18} />
                  {t('Contact', 'تواصل')}
                </span>
                <span>
                  <WhatsAppIcon />
                  WhatsApp
                </span>
                <span>
                  <MapPin size={18} />
                  {t('Itinéraire', 'المسار')}
                </span>
              </div>
              {i === 0 ? (
                <div className="visual-phone-info">
                  <span>
                    <Phone size={16} />
                    {t('Vos coordonnées', 'معلومات التواصل ديالك')}
                  </span>
                  <span>
                    <MapPin size={16} />
                    {t('Oujda, Maroc', 'وجدة، المغرب')}
                  </span>
                  <span>
                    <CalendarDays size={16} />
                    {t('Vos rendez-vous', 'المواعيد ديالك')}
                  </span>
                </div>
              ) : (
                <div className="visual-phone-product">
                  <strong>
                    {t(
                      i === 1 ? 'Nos produits' : 'Notre menu',
                      i === 1 ? 'المنتجات ديالنا' : 'المينيو ديالنا',
                    )}
                  </strong>
                  <div className="visual-triptych" dir="ltr">
                    <img
                      src="/landing/activities.webp"
                      width="2172"
                      height="724"
                      loading="lazy"
                      alt=""
                      style={{ transform: 'translateX(-' + (i * 100) / 3 + '%)' }}
                    />
                  </div>
                  <span>
                    {t(
                      i === 1 ? 'Votre sélection en images' : 'Les saveurs du jour',
                      i === 1 ? 'اختياراتك بالصور' : 'أطباق اليوم',
                    )}
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="visual-example-caption">
        <p aria-live="polite">
          {t('Exemple sélectionné : ', 'المثال المختار: ')}
          {labels[selected][ar ? 1 : 0]}
          <span>
            {t('Exemples fictifs · fonctions selon le pack', 'أمثلة للتوضيح · الوظائف حسب الباقة')}
          </span>
        </p>
        <a className="secondary" href={demo}>
          {t('Explorer la démo', 'شوف المثال التجريبي')}
          <ArrowUpRight size={18} />
        </a>
      </div>
    </section>
  );
}
