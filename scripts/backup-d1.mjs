// D1 backup: export -> AES-256-GCM -> R2 (private bucket).
// Usage: node scripts/backup-d1.mjs [--db=soralink-db] [--bucket=soralink-backups]
// Requires BACKUP_ENCRYPTION_KEY: 64 hex chars (32 bytes) or base64.
import { createCipheriv, randomBytes, createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const found = args.find((arg) => arg.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};
const db = opt('db', 'soralink-db');
const bucket = opt('bucket', 'soralink-backups');

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

const dir = await mkdtemp(path.join(tmpdir(), 'soralink-backup-'));
const sqlFile = path.join(dir, 'dump.sql');
const encFile = path.join(dir, 'dump.sql.enc');
try {
  console.log(`Export ${db} (remote)...`);
  wrangler('d1', 'export', db, '--remote', '--output', sqlFile);
  const sql = await readFile(sqlFile);
  if (!sql.length) throw new Error('Export vide');

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(sql), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Header: magic + version + iv + tag, then ciphertext.
  const payload = Buffer.concat([Buffer.from('SORA1'), iv, tag, ciphertext]);
  await import('node:fs/promises').then((fs) => fs.writeFile(encFile, payload));

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const digest = createHash('sha256').update(payload).digest('hex').slice(0, 12);
  const objectKey = `backups/${db}/${stamp}-${digest}.sql.enc`;
  console.log(`Chiffrement ${(payload.length / 1024).toFixed(1)} Ko -> ${objectKey}`);
  wrangler('r2', 'object', 'put', `${bucket}/${objectKey}`, '--file', encFile, '--remote');
  console.log(`Sauvegarde envoyÃ©e: r2://${bucket}/${objectKey}`);
  console.log(`sha256 (payload): ${createHash('sha256').update(payload).digest('hex')}`);
  const { size } = await stat(encFile);
  console.log(`Taille: ${size} octets`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
