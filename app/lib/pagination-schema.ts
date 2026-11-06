import { z } from 'zod';
import { parsePosition } from './pagination';

// Server-only cursor schema; pagination.ts stays free of zod for the browser bundle.
export const cursorSchema = z
  .string()
  .max(400)
  .refine((value) => parsePosition(value) !== null, 'Position de lecture invalide.');
