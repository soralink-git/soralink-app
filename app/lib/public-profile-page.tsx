import { notFound } from 'next/navigation';
import PublicCardView from '../public-card-view';
import { db, active } from './server';
import { publicCardData } from './public-card';
import { currentPublicName } from './address-storage';
import { normalizePublicName, publicNameError, publicCardPath } from './public-address';

type ProfileKey = { id: string } | { name: string };
async function readProfile(key: ProfileKey) {
  if ('id' in key)
    return db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(key.id)
      .first<any>();
  const name = normalizePublicName(key.name);
  if (publicNameError(name)) return null;
  return db()
    .prepare(
      'SELECT p.* FROM profiles p JOIN profile_addresses a ON a.profile=p.id WHERE a.name=? AND p.published=1',
    )
    .bind(name)
    .first<any>();
}
export async function publicProfileMetadata(key: ProfileKey) {
  try {
    const profile = await readProfile(key);
    if (profile && active(profile)) {
      const d = publicCardData(JSON.parse(profile.data), !!profile.pro_enabled);
      const title =
        String(d.business || d.name || 'Carte professionnelle').slice(0, 120) + ' — SoraLink';
      const description = String(
        d.bio || 'Découvrez cette carte professionnelle, ses contenus et ses coordonnées.',
      ).slice(0, 180);
      const canonical =
        'https://soralink.link' +
        publicCardPath(profile.id, await currentPublicName(db(), profile.id));
      return {
        title,
        alternates: { canonical },
        description,
        openGraph: {
          type: 'website',
          siteName: 'SoraLink',
          title,
          description,
          url: canonical,
          images: [
            {
              url: 'https://soralink.link/og-soralink.png',
              width: 1200,
              height: 630,
              alt: 'Carte professionnelle SoraLink',
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: ['https://soralink.link/og-soralink.png'],
        },
      };
    }
  } catch {}
  return {
    title: 'Carte indisponible — SoraLink',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'SoraLink',
      description: 'Carte professionnelle indisponible',
      images: ['https://soralink.link/og-soralink.png'],
    },
  };
}
export async function publicProfilePage(key: ProfileKey, lang?: string) {
  let cardId = '',
    publicName = '';
  let initialData = null,
    initialError = 'notfound';
  try {
    const profile = await readProfile(key);
    if (profile && active(profile)) {
      cardId = profile.id;
      publicName = await currentPublicName(db(), profile.id);
      initialData = publicCardData(JSON.parse(profile.data), !!profile.pro_enabled);
      initialError = '';
    }
  } catch {
    initialError = 'service';
  }
  if (!initialData && initialError === 'notfound') notFound();
  if (initialError === 'service') throw new Error('Card storage unavailable');
  return (
    <PublicCardView
      cardId={cardId}
      publicName={publicName}
      initialData={initialData}
      initialError={initialError}
      initialAr={
        lang ? lang === 'ar' : initialData?.defaultLanguage === 'ar' || initialData?.lang === 'ar'
      }
    />
  );
}
