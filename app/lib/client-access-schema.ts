import { z } from 'zod';
import { clientSectionKeys } from './client-access-config';

// Server-only validation schema. Keeping zod out of client-access-config removes
// the whole runtime from the public card bundle.
export const clientAccessSchema = z
  .object({
    modules: z
      .object({
        catalogue: z.boolean().optional(),
        activity: z.boolean().optional(),
        appointments: z.boolean().optional(),
      })
      .strict()
      .default({}),
    sections: z
      .object(
        Object.fromEntries(clientSectionKeys.map((key) => [key, z.boolean().optional()])) as Record<
          string,
          z.ZodOptional<z.ZodBoolean>
        >,
      )
      .strict()
      .default({}),
  })
  .strict();

export type ClientAccessConfig = z.infer<typeof clientAccessSchema>;
