'use client';
import Pwa from './pwa';
import { WhatsAppIcon } from './card-helpers';

export default function SiteFooter({ ar, className = '' }: { ar: boolean; className?: string }) {
  const t = (fr: string, da: string) => (ar ? da : fr);
  return (
    <footer className={['site-footer', className].filter(Boolean).join(' ')}>
      <div>
        <a className="brand" dir="ltr" href={'/?lang=' + (ar ? 'ar' : 'fr')}>
          Sora<span>Link</span>
        </a>
        <p>{t('Votre activité, à portée de main.', 'النشاط ديالك، قريب ليك.')}</p>
        <span>{t('Oujda · Maroc', 'وجدة · المغرب')}</span>
      </div>
      <div className="footer-contact">
        <strong>{t('Parlons de votre carte', 'نهضرو على الكارط ديالك')}</strong>
        <a
          dir="ltr"
          href="mailto:contact@soralink.link"
          className="footer-email-link"
          title={t('Nous écrire par e-mail', 'مراسلتنا عبر البريد الإلكتروني')}
        >
          contact@soralink.link
        </a>
        <a dir="ltr" href="tel:+212661446664">
          +212 661 446 664
        </a>
        <a href="https://wa.me/212661446664" target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
          WhatsApp
        </a>
      </div>
      <div className="footer-links">
        <a href={'/conditions?lang=' + (ar ? 'ar' : 'fr')}>
          {t('Conditions de service', 'شروط الخدمة')}
        </a>
        <a href={'/confidentialite?lang=' + (ar ? 'ar' : 'fr')}>
          {t('Confidentialité', 'الخصوصية')}
        </a>
        <a href={'/?lang=' + (ar ? 'ar' : 'fr') + '#tarifs'}>
          {t('Offres et renouvellement', 'العروض والتجديد')}
        </a>
        <Pwa ar={ar} />
      </div>
    </footer>
  );
}
