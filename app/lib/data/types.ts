import type { z } from 'zod';
import type { dataActionSchema } from '../api-validation';
import type { identity } from '../server';
export type Action<K extends z.infer<typeof dataActionSchema>['action']> = Extract<
  z.infer<typeof dataActionSchema>,
  { action: K }
>;
export type DataUser = NonNullable<Awaited<ReturnType<typeof identity>>['user']>;
