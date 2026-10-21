import { z } from 'zod';
export const clientSectionKeys = [
  'coordinates',
  'interface',
  'actions',
  'links',
  'content',
  'contacts',
  'requests',
  'schedule',
  'share',
] as const;
export type ClientSection = (typeof clientSectionKeys)[number];
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
          ClientSection,
          z.ZodOptional<z.ZodBoolean>
        >,
      )
      .strict()
      .default({}),
  })
  .strict();
export type ClientAccess = z.infer<typeof clientAccessSchema>;
export function readClientAccess(profile?: any): ClientAccess {
  const raw = profile?.client_access;
  if (raw == null) return { modules: {}, sections: {} };
  try {
    const parsed = clientAccessSchema.safeParse(typeof raw === 'string' ? JSON.parse(raw) : raw);
    if (parsed.success) return parsed.data;
  } catch {}
  // Corrupted administrative configuration never grants access.
  return {
    modules: { catalogue: false, activity: false, appointments: false },
    sections: Object.fromEntries(clientSectionKeys.map((key) => [key, false])),
  };
}
export function managementRevision(profile: any) {
  return JSON.stringify([
    profile.plan,
    profile.state,
    profile.expires ?? null,
    profile.pro_enabled ?? 0,
    profile.client_access ?? null,
  ]);
}
