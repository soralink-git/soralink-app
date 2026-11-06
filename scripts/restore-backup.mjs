// Restore a D1 backup produced by backup-d1.mjs.
// Usage: node scripts/restore-backup.mjs --key=backups/... --target-db=scratch [--remote]
// Refuses to write into the production database unless --force is passed.
import { createDecipheriv } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const found = args.find((arg) => arg.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const keyName = opt('key', '');
const target = opt('target-db', '');
const bucket = opt('bucket', 'soralink-backups');
const remote = args.includes('--remote');
const force = args.includes('--force');
if (!keyName || !target) throw new Error('--key et --target-db sont requis');
if (!force && target === 'soralink-db')
  throw new Error('Cible de production refusÃ©e sans --force');

function key() {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) throw new Error('BACKUP_ENCRYPTION_KEY manquante');
  const bytes = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (bytes.length !== 32) throw new Error('BACKUP_ENCRYPTION_KEY doit faire 32 octets');
  return bytes;
}

function wrangler(...params) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...params], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    console.error((result.stderr || '').split('\n').slice(-8).join('\n'));
    throw new Error('wrangler ' + params.join(' ') + ' a Ã©chouÃ©');
  }
  return result.stdout;
}

const dir = await mkdtemp(path.join(tmpdir(), 'soralink-restore-'));
const encFile = path.join(dir, 'dump.sql.enc');
const sqlFile = path.join(dir, 'dump.sql');
try {
  console.log(`TÃ©lÃ©chargement r2://${bucket}/${keyName}...`);
  wrangler('r2', 'object', 'get', `${bucket}/${keyName}`, '--file', encFile, '--remote');
  const payload = await readFile(encFile);
  if (payload.subarray(0, 5).toString() !== 'SORA1') throw new Error('Format inconnu');
  const iv = payload.subarray(5, 17);
  const tag = payload.subarray(17, 33);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  const sql = Buffer.concat([decipher.update(payload.subarray(33)), decipher.final()]);
  await writeFile(sqlFile, sql);
  console.log(`DÃ©chiffrÃ©: ${(sql.length / 1024).toFixed(1)} Ko`);
  console.log(`Restauration vers ${target}${remote ? ' (remote)' : ' (local)'}...`);
  wrangler('d1', 'execute', target, ...(remote ? ['--remote'] : ['--local']), '--file', sqlFile);
  console.log('Restauration terminÃ©e.');
} finally {
  await rm(dir, { recursive: true, force: true });
}
