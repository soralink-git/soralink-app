'use client';
import { useEffect, useState, type ReactNode } from 'react';
import ThemeToggle from './theme-toggle';
import { Nfc, Globe } from 'lucide-react';

export default function LegalView({
  initialArabic,
  french,
  arabic,
}: {
  initialArabic: boolean;
  french: ReactNode;
  arabic: ReactNode;
}) {
  const [ar, setAr] = useState(initialArabic);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  return (
    <div className="site" dir={ar ? 'rtl' : 'ltr'}>
      <header>
        <a className="brand" href={'/?lang=' + (ar ? 'ar' : 'fr')} dir="ltr">
          <span className="brand-icon">
            <Nfc />
          </span>
          Sora<span>Link</span>
        </a>
        <div className="header-actions">
          <ThemeToggle ar={ar} />
          <button
            className="language"
            onClick={() => {
              const next = !ar;
              setAr(next);
              const u = new URL(location.href);
              u.searchParams.set('lang', next ? 'ar' : 'fr');
              history.replaceState(null, '', u.pathname + u.search);
            }}
          >
            <Globe size={17} />
            {ar ? 'Français' : 'العربية'}
          </button>
          <a className="secondary small" href={'/?lang=' + (ar ? 'ar' : 'fr')}>
            {ar ? 'الرئيسية' : 'Accueil'}
          </a>
        </div>
      </header>
      <main className="section legal-page">
        {ar ? arabic : french}
        <div style={{ marginTop: '32px' }}>
          <a className="secondary small" href={'/?lang=' + (ar ? 'ar' : 'fr')}>
            {ar ? '← رجع للرئيسية' : '← Retour à l’accueil'}
          </a>
        </div>
      </main>
    </div>
  );
}
