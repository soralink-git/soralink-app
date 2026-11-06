import { capabilities } from './offers';
import { catalogRights } from './catalog-menu';
import { notFound } from 'next/navigation';
import PublicCardView from '../public-card-view';
import { db, active } from './server';
import { publicCardData } from './public-card';
import { currentPublicName } from './address-storage';
import { publicCardPath } from './public-address';
import { profileName } from './profile-identity';
import { readPublicProfile, type ProfileKey } from './public-profile-lookup';

function unavailableMetadata() {
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
export async function publicProfileMetadata(key: ProfileKey) {
  let profile: any = null;
  try {
    profile = await readPublicProfile(key);
  } catch {
    return unavailableMetadata();
  }
  // Resolve the 404 before the HTML shell is flushed so search engines and
  // link previews receive a real 404 for missing or suspended cards.
  if (!profile || !active(profile)) notFound();
  const d = publicCardData(
    JSON.parse(profile.data),
    !!profile.pro_enabled,
    catalogRights(profile),
    capabilities(profile),
  );
  const name = profileName(d) || 'Carte professionnelle';
  const title = String(name).slice(0, 120) + ' — SoraLink';
  const description = String(
    d.bio || 'Découvrez cette carte professionnelle, ses contenus et ses coordonnées.',
  ).slice(0, 180);
  const canonical =
    'https://soralink.link' + publicCardPath(profile.id, await currentPublicName(db(), profile.id));
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
export async function publicProfilePage(key: ProfileKey, lang?: string) {
  let cardId = '',
    publicName = '';
  let initialData = null,
    initialError = 'notfound';
  try {
    const profile = await readPublicProfile(key);
    if (profile && active(profile)) {
      cardId = profile.id;
      publicName = await currentPublicName(db(), profile.id);
      initialData = publicCardData(
        JSON.parse(profile.data),
        !!profile.pro_enabled,
        catalogRights(profile),
        capabilities(profile),
      );
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
