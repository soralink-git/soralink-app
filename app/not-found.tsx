'use client';
import { useEffect, useState } from 'react';
export default function NotFound() {
  const [ar, setAr] = useState(false);
  useEffect(() => {
    setAr(new URLSearchParams(location.search).get('lang') === 'ar');
  }, []);
  useEffect(() => {
    document.documentElement.lang = ar ? 'ar' : 'fr';
    document.documentElement.dir = ar ? 'rtl' : 'ltr';
  }, [ar]);
  return (
    <main id="main-content" tabIndex={-1} className="section legal-page" dir={ar ? 'rtl' : 'ltr'}>
      <a className="brand" href={'/?lang=' + (ar ? 'ar' : 'fr')} dir="ltr">
        SoraLink
      </a>
      <button
        className="language"
        onClick={() => {
          const next = !ar;
          setAr(next);
          const url = new URL(location.href);
          url.searchParams.set('lang', next ? 'ar' : 'fr');
          history.replaceState(null, '', url.pathname + url.search);
        }}
      >
        {ar ? 'Français' : 'العربية'}
      </button>
      <h1>{ar ? 'الصفحة ما متوفراش' : 'Page indisponible'}</h1>
      <p>
        {ar
          ? 'الرابط ما كاينش ولا الكارط ما منشوراش.'
          : 'Ce lien n’existe pas ou cette carte n’est pas publiée.'}
      </p>
      <a href={'/?lang=' + (ar ? 'ar' : 'fr')}>{ar ? 'رجع للرئيسية' : 'Retour à l’accueil'}</a>
    </main>
  );
}
