import { readPage, type History } from './pagination';

export async function readHistory(
  database: D1Database,
  owner: string,
  profile: string | undefined,
  history: History,
  cursor?: string,
) {
  if (history === 'orders')
    return readPage(database, 'SELECT * FROM orders', 'owner=?', [owner], cursor);
  if (!profile) return { items: [], nextCursor: null };
  return readPage(
    database,
    history === 'contacts'
      ? 'SELECT id,name,phone,email,message,created,service AS sourceCardId FROM requests'
      : 'SELECT * FROM requests',
    history === 'contacts' ? "profile=? AND kind='contact'" : "profile=? AND kind!='contact'",
    [profile],
    cursor,
  );
}

export async function requestNotifications(
  database: D1Database,
  profile: string | undefined,
  requests: { id: string }[],
) {
  if (!profile || !requests.length) return [];
  // Latest professional and visitor status for each visible request, including old pages.
  const result = await database
    .prepare(
      `SELECT id,request_id,state,error,created FROM (
        SELECT id,request_id,state,error,created,
          ROW_NUMBER() OVER (PARTITION BY request_id ORDER BY created DESC,id DESC) AS rank
        FROM notifications WHERE profile=? AND request_id IN (${requests.map(() => '?').join(',')})
      ) WHERE rank<=2 ORDER BY created DESC,id DESC`,
    )
    .bind(profile, ...requests.map((request) => request.id))
    .all();
  return result.results;
}
