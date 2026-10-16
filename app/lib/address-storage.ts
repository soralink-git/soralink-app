export async function currentPublicName(database: D1Database, profile: string) {
  const row = await database
    .prepare('SELECT name FROM profile_addresses WHERE profile=? AND is_current=1')
    .bind(profile)
    .first<{ name: string }>();
  return row?.name || '';
}
export async function reservePublicName(
  database: D1Database,
  owner: string,
  profile: string,
  name: string,
) {
  // Both statements run in the same D1 transaction. A competing owner cannot demote
  // this profile's existing address, and historic names are never reassigned.
  const results = await database.batch([
    database
      .prepare(
        `UPDATE profile_addresses SET is_current=0 WHERE profile=?
      AND EXISTS(SELECT 1 FROM profiles WHERE id=? AND owner=?)
      AND NOT EXISTS(SELECT 1 FROM profile_addresses WHERE name=? AND profile<>?)`,
      )
      .bind(profile, profile, owner, name, profile),
    database
      .prepare(
        `INSERT INTO profile_addresses(name,profile,is_current,created)
      SELECT ?,?,1,? WHERE EXISTS(SELECT 1 FROM profiles WHERE id=? AND owner=?)
      ON CONFLICT(name) DO UPDATE SET is_current=1 WHERE profile_addresses.profile=excluded.profile`,
      )
      .bind(name, profile, new Date().toISOString(), profile, owner),
  ]);
  return results[1].meta.changes === 1;
}
