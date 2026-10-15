import { z } from 'zod';

export const PAGE_SIZE = 50;
const position = z.tuple([z.string().datetime(), z.string().min(1).max(128)]);
export const cursorSchema = z
  .string()
  .max(400)
  .refine((value) => {
    try {
      return position.safeParse(JSON.parse(value)).success;
    } catch {
      return false;
    }
  }, 'Position de lecture invalide.');

export type History = 'requests' | 'contacts' | 'orders';
export type PageInfo = { nextCursor: string | null };

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
    const [date, id] = position.parse(JSON.parse(cursor));
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
