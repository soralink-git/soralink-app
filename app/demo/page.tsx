import PublicCardView from '../public-card-view';
import { demoCard, demoCardArabic } from '../lib/demo-card';
export const metadata = {
  title: 'Démo SoraLink — Exemple de carte digitale',
  description:
    'Explorez un exemple fictif de carte SoraLink, avec catalogue, promotion et rendez-vous.',
};
export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return (
    <PublicCardView initialData={demoCard} demoArabic={demoCardArabic} initialAr={lang === 'ar'} />
  );
}
