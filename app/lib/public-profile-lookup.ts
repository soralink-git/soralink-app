import { db } from './server';
import { normalizePublicName, publicNameError } from './public-address';
import { readCard } from './card-storage';

export type ProfileKey = { id: string } | { name: string };

// Resolve both card kinds before streaming, preserving true 404 and storage errors.
export async function readPublicProfile(key: ProfileKey) {
  if ('id' in key) return readCard(db(), key.id, { published: true });
  const name = normalizePublicName(key.name);
  if (publicNameError(name)) return null;
  const address = await db()
    .prepare('SELECT profile FROM profile_addresses WHERE name=?')
    .bind(name)
    .first<{ profile: string }>();
  return address ? readCard(db(), address.profile, { published: true }) : null;
}
