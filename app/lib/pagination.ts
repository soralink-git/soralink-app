export const PAGE_SIZE = 50;

export type History = 'requests' | 'contacts' | 'orders';
export type PageInfo = { nextCursor: string | null };

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Cursor parsing without zod: this module is imported by client components.
export function parsePosition(value: unknown): [string, string] | null {
  let parsed: unknown;
  try {
    parsed = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) return null;
  const [date, id] = parsed;
  if (typeof date !== 'string' || !DATETIME_RE.test(date) || Number.isNaN(Date.parse(date)))
    return null;
  if (typeof id !== 'string' || id.length < 1 || id.length > 128) return null;
  return [date, id];
}

// SQL fragments are supplied only by server code. Cursor values remain bound parameters.
export async function readPage(
  database: D1Database,
  select: string,
  where: string,
  values: (string | number)[],
  cursor?: string,
  dateColumn = 'created',
  idColumn = 'id',
) {
  const params = [...values];
  if (cursor) {
    const position = parsePosition(cursor);
    if (!position) throw new Error('Position de lecture invalide.');
    const [date, id] = position;
    where += ` AND (${dateColumn} < ? OR (${dateColumn} = ? AND ${idColumn} < ?))`;
    params.push(date, date, id);
  }
  const result = await database
    .prepare(`${select} WHERE ${where} ORDER BY ${dateColumn} DESC, ${idColumn} DESC LIMIT ?`)
    .bind(...params, PAGE_SIZE + 1)
    .all<Record<string, any>>();
  const items = result.results.slice(0, PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      result.results.length > PAGE_SIZE && last
        ? JSON.stringify([last[dateColumn.split('.').at(-1)!], last.id])
        : null,
  };
}

export function appendUnique<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}
