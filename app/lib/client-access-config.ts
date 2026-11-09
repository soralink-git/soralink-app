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

const moduleKeys = ['catalogue', 'activity', 'appointments', 'single_action'] as const;

export type ClientAccess = {
  modules: Partial<Record<(typeof moduleKeys)[number], boolean>>;
  sections: Partial<Record<ClientSection, boolean>>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Returns null when a key is unknown or a value is not a boolean, mirroring the
// former strict zod schema without shipping zod to the browser.
function readBooleans(raw: unknown, keys: readonly string[]) {
  if (raw === undefined) return {};
  if (!isPlainObject(raw)) return null;
  const result: Record<string, boolean> = {};
  for (const key of Object.keys(raw)) {
    if (!keys.includes(key) || typeof raw[key] !== 'boolean') return null;
    result[key] = raw[key] as boolean;
  }
  return result;
}

function denied(): ClientAccess {
  return {
    modules: { catalogue: false, activity: false, appointments: false },
    sections: Object.fromEntries(clientSectionKeys.map((key) => [key, false])) as Partial<
      Record<ClientSection, boolean>
    >,
  };
}

export function readClientAccess(profile?: any): ClientAccess {
  const raw = profile?.client_access;
  if (raw == null) return { modules: {}, sections: {} };
  let value: unknown;
  try {
    value = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return denied();
  }
  // Corrupted administrative configuration never grants access.
  if (!isPlainObject(value)) return denied();
  if (Object.keys(value).some((key) => key !== 'modules' && key !== 'sections')) return denied();
  const modules = readBooleans(value.modules, moduleKeys);
  const sections = readBooleans(value.sections, clientSectionKeys);
  if (!modules || !sections) return denied();
  return {
    modules: modules as ClientAccess['modules'],
    sections: sections as ClientAccess['sections'],
  };
}

export function managementRevision(profile: any) {
  return JSON.stringify([
    profile.plan,
    profile.state,
    profile.expires ?? null,
    profile.pro_enabled ?? 0,
    profile.client_access ?? null,
    profile.card_limit ?? profile.cardLimit ?? 1,
  ]);
}
