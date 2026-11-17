// Restore only into a distinct bucket. Verify authentication, size and hash before each write.
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createDecipheriv, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, open, stat, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { r2Client, encryptionKey, unseal } from './backup-r2.mjs';

export async function restoreFiles({
  source,
  destination,
  backupBucket,
  targetBucket,
  manifestKey,
  key,
}) {
  if (!targetBucket || targetBucket === backupBucket || targetBucket === 'soralink-files')
    throw Error('Bucket de restauration isolé requis');
  const object = await source.send(
    new GetObjectCommand({ Bucket: backupBucket, Key: manifestKey }),
  );
  const manifest = JSON.parse(unseal(Buffer.from(await object.Body.transformToByteArray()), key));
  if (
    manifest.version !== 1 ||
    !Array.isArray(manifest.files) ||
    targetBucket === manifest.sourceBucket
  )
    throw Error('Manifeste invalide ou cible de production');
  const prefix = manifestKey.slice(0, manifestKey.lastIndexOf('/') + 1) + 'objects/';
  const seen = new Set();
  for (const entry of manifest.files) {
    if (
      typeof entry.key !== 'string' ||
      !entry.key ||
      seen.has(entry.key) ||
      !entry.backupKey?.startsWith(prefix) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes < 0 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)
    )
      throw Error('Entrée de manifeste invalide');
    seen.add(entry.key);
  }
  const directory = await mkdtemp(path.join(tmpdir(), 'soralink-r2-restore-'));
  try {
    for (const entry of manifest.files) {
      const encrypted = path.join(directory, 'object.enc'),
        plain = path.join(directory, 'object');
      const backup = await source.send(
        new GetObjectCommand({ Bucket: backupBucket, Key: entry.backupKey }),
      );
      await pipeline(backup.Body, createWriteStream(encrypted, { mode: 0o600 }));
      if ((await stat(encrypted)).size !== entry.bytes + 33)
        throw Error('Taille chiffrée invalide');
      const header = Buffer.alloc(33),
        handle = await open(encrypted, 'r');
      try {
        await handle.read(header, 0, 33, 0);
      } finally {
        await handle.close();
      }
      if (header.subarray(0, 5).toString() !== 'SORA1') throw Error('Format inconnu');
      const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(5, 17)),
        hash = createHash('sha256');
      decipher.setAuthTag(header.subarray(17, 33));
      let bytes = 0;
      await pipeline(
        createReadStream(encrypted, { start: 33 }),
        decipher,
        new Transform({
          transform(chunk, encoding, done) {
            hash.update(chunk);
            bytes += chunk.length;
            done(null, chunk);
          },
        }),
        createWriteStream(plain, { mode: 0o600 }),
      );
      if (bytes !== entry.bytes || hash.digest('hex') !== entry.sha256)
        throw Error('Objet corrompu');
      const metadata = Object.fromEntries(
        [
          'ContentType',
          'CacheControl',
          'ContentDisposition',
          'ContentEncoding',
          'ContentLanguage',
          'Metadata',
        ]
          .filter((k) => entry[k] !== undefined)
          .map((k) => [k, entry[k]]),
      );
      if (entry.Expires) metadata.Expires = new Date(entry.Expires);
      await destination.send(
        new PutObjectCommand({
          Bucket: targetBucket,
          Key: entry.key,
          Body: createReadStream(plain),
          ContentLength: bytes,
          ...metadata,
        }),
      );
      await rm(encrypted);
      await rm(plain);
    }
    return { files: manifest.files.length };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = (name) =>
    process.argv
      .find((x) => x.startsWith('--' + name + '='))
      ?.split('=')
      .slice(1)
      .join('=');
  const manifestKey = arg('manifest'),
    targetBucket = arg('target-bucket');
  if (!manifestKey || !targetBucket) throw Error('--manifest et --target-bucket sont requis');
  const client = r2Client();
  try {
    const result = await restoreFiles({
      source: client,
      destination: client,
      backupBucket: process.env.R2_BACKUP_BUCKET || 'soralink-backups',
      targetBucket,
      manifestKey,
      key: encryptionKey(process.env.BACKUP_ENCRYPTION_KEY),
    });
    console.log(`Restauration R2 isolée : ${result.files} objets.`);
  } finally {
    client.destroy();
  }
}
