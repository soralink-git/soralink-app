'use client';
import { useEffect, useState, type ReactNode } from 'react';
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
    <main className="section legal-page" dir={ar ? 'rtl' : 'ltr'}>
      <a className="brand" href={'/?lang=' + (ar ? 'ar' : 'fr')} dir="ltr">
        SoraLink
      </a>
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
        {ar ? 'Français' : 'العربية'}
      </button>
      {ar ? arabic : french}
      <a className="text-button" href={'/?lang=' + (ar ? 'ar' : 'fr')}>
        {ar ? 'رجع للرئيسية' : 'Retour à l’accueil'}
      </a>
    </main>
  );
}
