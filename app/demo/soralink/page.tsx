import PublicCardView from '../../public-card-view';
import { soralinkTestCard, soralinkTestCardArabic } from '../../lib/soralink-test-card';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'SoraLink — Carte test complète',
  description:
    'Carte test SoraLink : coordonnées, offres NFC, cartes digitales et catalogue bilingue.',
};

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return (
    <PublicCardView
      initialData={soralinkTestCard}
      demoArabic={soralinkTestCardArabic}
      initialAr={lang === 'ar'}
    />
  );
}
