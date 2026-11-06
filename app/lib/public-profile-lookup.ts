import { db } from './server';
import { normalizePublicName, publicNameError } from './public-address';

export type ProfileKey = { id: string } | { name: string };

// Shared by the public page and the Pages entry point so an unknown or inactive
// card is answered with a real 404 even when the HTML stream starts early.
export async function readPublicProfile(key: ProfileKey) {
  if ('id' in key) {
    const primary = await db()
      .prepare('SELECT * FROM profiles WHERE id=? AND published=1')
      .bind(key.id)
      .first<any>();
    if (primary) return primary;
    try {
      return await db()
        .prepare(
          'SELECT s.*, p.plan, p.state, p.expires, p.pro_enabled, p.catalog_rights, p.client_access FROM secondary_cards s JOIN profiles p ON p.owner=s.owner WHERE s.id=? AND s.published=1',
        )
        .bind(key.id)
        .first<any>();
    } catch {
      return null;
    }
  }
  const name = normalizePublicName(key.name);
  if (publicNameError(name)) return null;
  const primaryByName = await db()
    .prepare(
      'SELECT p.* FROM profiles p JOIN profile_addresses a ON a.profile=p.id WHERE a.name=? AND p.published=1',
    )
    .bind(name)
    .first<any>();
  if (primaryByName) return primaryByName;
  try {
    return await db()
      .prepare(
        'SELECT s.*, p.plan, p.state, p.expires, p.pro_enabled, p.catalog_rights, p.client_access FROM secondary_cards s JOIN profiles p ON p.owner=s.owner JOIN profile_addresses a ON a.profile=s.id WHERE a.name=? AND s.published=1',
      )
      .bind(name)
      .first<any>();
  } catch {
    return null;
  }
}
