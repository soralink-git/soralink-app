'use client';
import { useEffect } from 'react';

// Printed or shared links to the former product landing keep their destination.
export default function GroupLegacyLinks() {
  useEffect(() => {
    const preserveProductAnchor = () => {
      if (!['#tarifs', '#fonctionnalites', '#exemples', '#faq'].includes(window.location.hash))
        return;
      const target = new URL(window.location.href);
      target.searchParams.set('offre', '1');
      window.location.replace(target.pathname + target.search + target.hash);
    };
    preserveProductAnchor();
    window.addEventListener('hashchange', preserveProductAnchor);
    return () => window.removeEventListener('hashchange', preserveProductAnchor);
  }, []);
  return null;
}
