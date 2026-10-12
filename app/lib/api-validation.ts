import { z } from 'zod';
import { catalogueError } from './catalogue';
import { promotionError } from './promotions';
import { recordedVideoUrl, mediaError } from './content-media';
import { sectionKeys } from './personalization';
import { whatsappNumber } from './whatsapp-notification';

const text = (max: number) => z.string().max(max);
const formText = (max: number) => z.preprocess((v) => (v == null ? '' : v), text(max)).default('');
const requiredText = (max: number) =>
  text(max).refine((v) => !!v.trim(), 'Renseignez les champs obligatoires.');
const id = requiredText(128);
const email = formText(254)
  .transform((v) => v.trim())
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'E-mail invalide');
export const calendarDate = z.string().refine((v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T12:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, 'Date invalide.');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const slot = z
  .string()
  .refine(
    (v) =>
      calendarDate.safeParse(v.slice(0, 10)).success &&
      /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(v),
    'Choisissez un créneau valide.',
  );
const serviceIndex = z.preprocess(
  (v) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v),
  z.number().int().min(0).max(4).default(0),
);
const color = z.union([z.literal(''), z.string().regex(/^#[0-9a-f]{6}$/i)]).optional();
const profileFields: Record<string, z.ZodTypeAny> = {};
for (const key of [
  'job',
  'business',
  'bio',
  'phone',
  'email',
  'address',
  'whatsapp',
  'website',
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'youtube',
  'x',
  'mapsUrl',
  'mapDestination',
  'template',
  'pdf',
  'video',
  'recordedVideo',
  'avatar',
  'cover',
])
  profileFields[key] = text(key === 'bio' ? 5000 : 4000).nullish();
for (const key of ['hidePhone', 'hideEmail', 'hideLocation', 'hideSocial', 'hideWhatsApp', 'pro'])
  profileFields[key] = z.boolean().optional();
export const profileDataSchema = z
  .object({
    ...profileFields,
    name: requiredText(120),
    photos: z.array(text(4000)).max(10).optional(),
    services: z
      .array(
        z.union([
          text(120),
          z
            .object({
              id: text(80).nullish(),
              type: z.enum(['product', 'service']).nullish(),
              name: text(120).nullish(),
              description: text(800).nullish(),
              category: text(80).nullish(),
              price: text(30).nullish(),
              image: text(4000).nullish(),
            })
            .passthrough(),
        ]),
      )
      .max(10)
      .optional(),
    promotions: z
      .array(
        z
          .object({
            id: text(80).nullish(),
            title: requiredText(120),
            description: text(800).nullish(),
            image: text(4000).nullish(),
            regularPrice: text(30).nullish(),
            promoPrice: text(30).nullish(),
            startDate: text(10).nullish(),
            endDate: text(10).nullish(),
            enabled: z.boolean().optional(),
          })
          .passthrough(),
      )
      .max(10)
      .optional(),
    color,
    textColor: color,
    buttonColor: color,
    cardTheme: z.enum(['light', 'dark', 'sand']).optional(),
    cardFont: z.enum(['modern', 'classic', 'simple']).optional(),
    buttonShape: z.enum(['rounded', 'square', 'pill']).optional(),
    avatarShape: z.enum(['circle', 'square']).optional(),
    textSize: z.enum(['normal', 'large', 'extra']).optional(),
    buttonSize: z.enum(['normal', 'large']).optional(),
    buttonStyle: z.enum(['filled', 'outline']).optional(),
    sectionOrder: z.array(z.enum(sectionKeys)).max(9).optional(),
    hiddenSections: z.array(z.enum(sectionKeys)).max(9).optional(),
    sectionTitles: z
      .object({ fr: z.record(text(120)).optional(), ar: z.record(text(120)).optional() })
      .optional(),
    hours: z.record(z.tuple([time, time])).optional(),
    breakStart: time.optional(),
    breakEnd: time.optional(),
    closures: z.array(calendarDate).max(180).optional(),
    appointmentServices: z
      .array(
        z.object({
          name: requiredText(100),
          duration: z
            .union([z.number(), z.string()])
            .refine(
              (v) => [15, 30, 45, 60, 90, 120].includes(Number(v)),
              'Durée de prestation invalide.',
            ),
        }),
      )
      .max(5)
      .optional(),
  })
  .passthrough()
  .superRefine((d, ctx) => {
    const errors = [
      JSON.stringify(d).length > 35000 ? 'Informations invalides : carte trop volumineuse.' : null,
      catalogueError(d.services),
      promotionError(d.promotions),
      d.recordedVideo && !recordedVideoUrl(d.recordedVideo) ? 'Lien de vidéo invalide' : null,
    ];
    for (const error of errors)
      if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
  });
const requestObject = z.object({
  action: z.literal('request'),
  profile: id,
  kind: z.enum(['devis', 'commande', 'rdv', 'contact']),
  name: formText(120),
  phone: formText(40),
  email,
  message: formText(2000),
  slot: formText(32),
  service: serviceIndex,
  catalogueId: text(80).nullish(),
  shareCard: z.boolean().default(false),
  consent: z.boolean().optional(),
  trap: formText(0),
});
function requestRules(b: z.infer<typeof requestObject>, ctx: z.RefinementCtx, resolved = false) {
  const issue = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
  if (b.shareCard && b.kind !== 'contact') issue('Type de partage invalide');
  if ((!b.shareCard || resolved) && (!b.name.trim() || !b.phone.trim()))
    issue('Renseignez un nom et un téléphone.');
  if (
    b.kind === 'contact' &&
    (b.consent !== true ||
      b.message.length > 1000 ||
      ((!b.shareCard || resolved) && !whatsappNumber(b.phone)))
  )
    issue('Vérifiez vos coordonnées et votre accord de partage');
  if (b.catalogueId != null && b.kind !== 'commande') issue('Type de demande invalide');
  if (b.kind === 'rdv' && !slot.safeParse(b.slot).success) issue('Choisissez un créneau valide.');
}
export const resolvedRequestSchema = requestObject.superRefine((b, ctx) =>
  requestRules(b, ctx, true),
);
export const dataActionSchema = z
  .discriminatedUnion('action', [
    requestObject,
    z.object({
      action: z.literal('save'),
      data: profileDataSchema,
      published: z.boolean().default(false),
    }),
    z.object({
      action: z.literal('manual'),
      name: requiredText(120),
      phone: requiredText(40),
      email,
      message: formText(2000),
      slot,
      service: serviceIndex,
    }),
    z.object({
      action: z.literal('order'),
      plan: z.enum(['Digital', 'Pack', 'Accompagnement', 'Pro']),
    }),
    z.object({
      action: z.literal('status'),
      id,
      status: z.enum(['confirmed', 'cancelled', 'done', 'new']),
    }),
    z.object({ action: z.literal('deleteContact'), id }),
  ])
  .superRefine((b, ctx) => {
    if (b.action === 'request') requestRules(b, ctx);
  });
export const adminActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('profile'),
    id,
    state: z.enum(['active', 'trial', 'suspended']),
    plan: z.enum(['Digital', 'Pack', 'Accompagnement']),
    expires: formText(10).refine(
      (v) => !v || calendarDate.safeParse(v).success,
      'Date d’expiration invalide.',
    ),
    pro: z.boolean().default(false),
  }),
  z.object({
    action: z.literal('order'),
    id,
    status: z.enum([
      'pending',
      'paid',
      'design',
      'production',
      'ready',
      'shipped',
      'delivered',
      'cancelled',
    ]),
  }),
]);
const authEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Renseignez une adresse e-mail valide.');
const password = z.string().min(10).max(128);
export const authActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('login'), email: authEmail, password: z.string().min(1).max(128) }),
  z.object({ action: z.literal('signup'), email: authEmail, password }),
  z.object({ action: z.literal('password'), password }),
  z.object({ action: z.literal('reset'), email: authEmail }),
  z.object({ action: z.literal('resend'), email: authEmail }),
  z.object({ action: z.literal('logout') }),
  z.object({ action: z.literal('legacy') }),
]);
export const dataQuerySchema = z.object({ id: id.optional(), exchange: z.literal('1').optional() });
export const availabilityQuerySchema = z.object({ id, date: calendarDate, service: serviceIndex });
export const uploadQuerySchema = z
  .object({
    stats: z.literal('1').optional(),
    key: z
      .string()
      .regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
      .optional(),
  })
  .refine((v) => v.stats === '1' || !!v.key);
export const mediaUploadSchema = z
  .object({ type: z.string(), size: z.number().int().positive() })
  .superRefine((v, ctx) => {
    const error = mediaError(v.type, v.size);
    if (error) ctx.addIssue({ code: z.ZodIssueCode.custom, message: error });
  });

export class ApiInputError extends Error {
  constructor(
    message = 'Vérifiez les informations envoyées.',
    public status = 400,
  ) {
    super(message);
  }
}
export function validateInput<S extends z.ZodTypeAny>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.code === 'custom');
    const first = result.error.issues[0];
    const field = first.path[first.path.length - 1];
    let message = issue?.message;
    if (!message && first.code === 'invalid_union_discriminator') message = 'Action inconnue';
    if (!message && field === 'email') message = 'Renseignez une adresse e-mail valide.';
    if (!message && field === 'password')
      message =
        first.code === 'too_small' && first.minimum === 10
          ? 'Choisissez un mot de passe de 10 à 128 caractères.'
          : 'Vérifiez votre mot de passe.';
    if (!message && field === 'name') message = 'Renseignez un nom (120 caractères maximum).';
    if (!message && field === 'phone') message = 'Renseignez un téléphone (40 caractères maximum).';
    if (!message && field === 'photos') message = 'Ajoutez jusqu’à 10 photos.';
    throw new ApiInputError(message);
  }
  return result.data;
}
export function inputErrorResponse(error: unknown) {
  return error instanceof ApiInputError
    ? Response.json(
        {
          error: error.message,
          errorAr:
            error.status === 413
              ? 'الطلب كبير بزاف. نقص من المعلومات وعاود جرّب.'
              : 'راجع المعلومات اللي دخلتي وعاود جرّب.',
        },
        { status: error.status, headers: { 'Cache-Control': 'no-store' } },
      )
    : null;
}
export async function readValidatedJSON<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
  maxBytes = 160000,
): Promise<z.infer<S>> {
  if (Number(req.headers.get('content-length')) > maxBytes)
    throw new ApiInputError('La demande est trop volumineuse.', 413);
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (reader) {
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          throw new ApiInputError('La demande est trop volumineuse.', 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new ApiInputError('La demande contient des informations invalides.');
  }
  // Bound passthrough JSON before schema refinements serialize it again.
  const stack: Array<[unknown, number]> = [[value, 0]];
  let nodes = 0;
  while (stack.length) {
    const [item, depth] = stack.pop()!;
    if (++nodes > 20000 || depth > 32)
      throw new ApiInputError('La demande contient une structure trop complexe.');
    if (item && typeof item === 'object')
      for (const child of Object.values(item)) stack.push([child, depth + 1]);
  }
  return validateInput(schema, value);
}
