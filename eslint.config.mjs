import next from 'eslint-config-next';

// Rules that would require a dedicated refactor (autosave queue, previews, R2 image
// URLs) are reported as warnings so `pnpm lint` stays a real gate on new errors.
const overrides = {
  'react-hooks/set-state-in-effect': 'warn',
  'react-hooks/refs': 'warn',
  'react-hooks/exhaustive-deps': 'warn',
  'react-hooks/static-components': 'warn',
  '@next/next/no-img-element': 'warn',
  '@next/next/no-html-link-for-pages': 'warn',
  '@next/next/no-location-assign-relative-destination': 'warn',
  'import/no-anonymous-default-export': 'warn',
};

// A rule level must live in the same object as its plugin declaration.
const tuned = next.map((entry) => {
  const rules = {};
  for (const [rule, level] of Object.entries(overrides)) {
    const plugin = rule.split('/')[0];
    if (entry.plugins && entry.plugins[plugin]) rules[rule] = level;
  }
  return Object.keys(rules).length ? { ...entry, rules: { ...entry.rules, ...rules } } : entry;
});

const config = [
  {
    ignores: [
      'dist/**',
      '.next/**',
      '.wrangler/**',
      '.sites-runtime/**',
      'node_modules/**',
      'public/**',
      'drizzle/**',
    ],
  },
  ...tuned,
];

export default config;
