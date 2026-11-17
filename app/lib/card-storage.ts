// One identity lookup for primary and secondary cards. Account rights and the
// notification recipient always come from the owning primary profile.
export async function readCard(
  database: D1Database,
  id: string,
  options: { owner?: string; published?: boolean } = {},
) {
  const owner = options.owner ? ' AND owner=?' : '';
  const published = options.published ? ' AND published=1' : '';
  const args = options.owner ? [id, options.owner] : [id];
  const primary = await database
    .prepare('SELECT * FROM profiles WHERE id=?' + owner + published)
    .bind(...args)
    .first<any>();
  if (primary) return primary;
  return database
    .prepare(
      'SELECT s.*, p.email, p.plan, p.state, p.expires, p.pro_enabled, p.catalog_rights, p.client_access, p.card_limit FROM secondary_cards s JOIN profiles p ON p.owner=s.owner WHERE s.id=?' +
        (options.owner ? ' AND s.owner=?' : '') +
        (options.published ? ' AND s.published=1' : ''),
    )
    .bind(...args)
    .first<any>();
}

export async function readAccountCard(database: D1Database, owner: string, cardId?: string) {
  return cardId
    ? readCard(database, cardId, { owner })
    : database.prepare('SELECT * FROM profiles WHERE owner=?').bind(owner).first<any>();
}
