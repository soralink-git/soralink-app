// Applies the hand-written SQL migrations in drizzle/ and records them in D1.
// The Drizzle journal stopped at 0007, so this table is the source of truth from
// 0014 onward (0014 and 0015 were applied before this runner existed).
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const statusOnly = args.includes('--status');
const baseline = args.includes('--baseline');
const local = args.includes('--local');
const dbArg = args.find((arg) => arg.startsWith('--db='));
const db = dbArg ? dbArg.slice('--db='.length) : 'soralink-db';

function wrangler(extra) {
  const params = ['d1', 'execute', db, local ? '--local' : '--remote', '--json', ...extra];
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...params], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    console.error((result.stderr || '').split('\n').slice(-6).join('\n'));
    throw new Error('wrangler ' + params.join(' ') + ' failed');
  }
  const start = result.stdout.indexOf('[');
  if (start === -1) return [];
  const parsed = JSON.parse(result.stdout.slice(start));
  return parsed[0]?.results || [];
}

const files = readdirSync('drizzle')
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();

wrangler([
  '--command',
  'CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)',
]);

const applied = new Set(
  wrangler(['--command', 'SELECT name FROM schema_migrations'])
    .map((row) => row.name)
    .filter(Boolean),
);
const pending = files.filter((name) => !applied.has(name));

console.log(`Base    : ${db} (${local ? 'local' : 'remote'})`);
console.log(
  `Fichiers: ${files.length} | appliqués: ${applied.size} | en attente: ${pending.length}`,
);

if (statusOnly) {
  for (const name of pending) console.log('  en attente: ' + name);
  process.exit(0);
}

if (baseline) {
  const now = new Date().toISOString();
  for (const name of pending) {
    wrangler([
      '--command',
      `INSERT OR IGNORE INTO schema_migrations(name, applied_at) VALUES('${name}', '${now}')`,
    ]);
    console.log('  enregistré (sans exécution): ' + name);
  }
  process.exit(0);
}

for (const name of pending) {
  console.log('  application: ' + name);
  wrangler(['--file', 'drizzle/' + name]);
  wrangler([
    '--command',
    `INSERT INTO schema_migrations(name, applied_at) VALUES('${name}', '${new Date().toISOString()}')`,
  ]);
}
console.log('Migrations à jour.');
