'use client';
import { useEffect, useState } from 'react';

export default function SkipLink({ ar }: { ar: boolean }) {
  const [arabic, setArabic] = useState(ar);
  useEffect(() => {
    const html = document.documentElement;
    const update = () => setArabic(html.lang === 'ar');
    update();
    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ['lang'] });
    return () => observer.disconnect();
  }, []);
  return (
    <a className="skip-link" href="#main-content">
      {arabic ? 'دوز للمحتوى الرئيسي' : 'Aller au contenu principal'}
    </a>
  );
}
