// Encrypted, paginated R2 copy. No source objects are changed or deleted.
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, writeFile, open, stat, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function encryptionKey(raw) {
  if (!raw) throw Error('BACKUP_ENCRYPTION_KEY manquante');
  const key = /^[a-f0-9]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw Error('BACKUP_ENCRYPTION_KEY doit faire 32 octets');
  return key;
}
export function seal(bytes, key) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([Buffer.from('SORA1'), iv, cipher.getAuthTag(), body]);
}
export function unseal(bytes, key) {
  if (bytes.length < 33 || bytes.subarray(0, 5).toString() !== 'SORA1')
    throw Error('Format de sauvegarde inconnu');
  const cipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(5, 17));
  cipher.setAuthTag(bytes.subarray(17, 33));
  return Buffer.concat([cipher.update(bytes.subarray(33)), cipher.final()]);
}
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
const metadataKeys = [
  'ContentType',
  'CacheControl',
  'ContentDisposition',
  'ContentEncoding',
  'ContentLanguage',
  'Expires',
  'Metadata',
];
function metadata(object) {
  return Object.fromEntries(
    metadataKeys.filter((k) => object[k] !== undefined).map((k) => [k, object[k]]),
  );
}
async function uploadFile(client, bucket, key, file) {
  const size = (await stat(file)).size,
    checksum = await fileHash(file);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(file),
      ContentLength: size,
      ContentType: 'application/octet-stream',
      Metadata: { sha256: checksum },
    }),
  );
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  if (head.ContentLength !== size || head.Metadata?.sha256 !== checksum)
    throw Error('Vérification de sauvegarde échouée');
}
export async function backupFiles({
  source,
  destination,
  sourceBucket,
  backupBucket,
  key,
  prefix = 'backups/files/' +
    new Date().toISOString().replace(/[:.]/g, '-') +
    '-' +
    randomBytes(6).toString('hex'),
}) {
  if (!sourceBucket || !backupBucket || sourceBucket === backupBucket)
    throw Error('Buckets source et sauvegarde distincts requis');
  const directory = await mkdtemp(path.join(tmpdir(), 'soralink-r2-'));
  const manifest = { version: 1, sourceBucket, startedAt: new Date().toISOString(), files: [] };
  try {
    let token;
    const tokens = new Set();
    do {
      const page = await source.send(
        new ListObjectsV2Command({ Bucket: sourceBucket, MaxKeys: 1000, ContinuationToken: token }),
      );
      for (const item of page.Contents || []) {
        if (!item.Key || !item.ETag) throw Error('Objet source sans identité stable');
        const object = await source.send(
          new GetObjectCommand({ Bucket: sourceBucket, Key: item.Key, IfMatch: item.ETag }),
        );
        if (!object.Body || object.ETag !== item.ETag)
          throw Error('Objet source modifié pendant la copie');
        const file = path.join(directory, 'object.enc'),
          iv = randomBytes(12),
          hash = createHash('sha256');
        let bytes = 0;
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        await writeFile(file, Buffer.concat([Buffer.from('SORA1'), iv, Buffer.alloc(16)]), {
          mode: 0o600,
        });
        await pipeline(
          object.Body,
          new Transform({
            transform(chunk, encoding, done) {
              hash.update(chunk);
              bytes += chunk.length;
              done(null, chunk);
            },
          }),
          cipher,
          createWriteStream(file, { flags: 'r+', start: 33 }),
        );
        if (bytes !== object.ContentLength || bytes !== item.Size)
          throw Error('Taille source incohérente');
        const handle = await open(file, 'r+');
        try {
          await handle.write(cipher.getAuthTag(), 0, 16, 17);
        } finally {
          await handle.close();
        }
        const backupKey = prefix + '/objects/' + manifest.files.length + '.enc';
        await uploadFile(destination, backupBucket, backupKey, file);
        manifest.files.push({
          key: item.Key,
          backupKey,
          bytes,
          sha256: hash.digest('hex'),
          etag: item.ETag,
          ...metadata(object),
        });
        await rm(file);
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
      if (page.IsTruncated && (!token || tokens.has(token))) throw Error('Pagination R2 invalide');
      if (token) tokens.add(token);
    } while (token);
    manifest.completedAt = new Date().toISOString();
    const file = path.join(directory, 'manifest.enc'),
      manifestKey = prefix + '/manifest.enc';
    await writeFile(file, seal(Buffer.from(JSON.stringify(manifest)), key), { mode: 0o600 });
    await uploadFile(destination, backupBucket, manifestKey, file);
    // Publish a freshness marker only after the complete manifest is verified.
    await destination.send(
      new PutObjectCommand({
        Bucket: backupBucket,
        Key: 'backups/files/latest.json',
        Body: JSON.stringify({
          completedAt: manifest.completedAt,
          manifestKey,
          files: manifest.files.length,
        }),
        ContentType: 'application/json',
      }),
    );
    return { manifestKey, files: manifest.files.length };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
export function r2Client(environment = process.env) {
  for (const name of [
    'CLOUDFLARE_ACCOUNT_ID',
    'R2_BACKUP_ACCESS_KEY_ID',
    'R2_BACKUP_SECRET_ACCESS_KEY',
  ])
    if (!environment[name]) throw Error(name + ' manquant');
  return new S3Client({
    region: 'auto',
    endpoint: 'https://' + environment.CLOUDFLARE_ACCOUNT_ID + '.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: environment.R2_BACKUP_ACCESS_KEY_ID,
      secretAccessKey: environment.R2_BACKUP_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}
export async function checkFreshness(
  client,
  bucket,
  markerKey,
  maxAgeHours = 192,
  now = Date.now(),
) {
  const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: markerKey }));
  const status = JSON.parse(await object.Body.transformToString());
  const age = now - Date.parse(status.completedAt);
  if (!Number.isFinite(age) || age < -300000 || age > maxAgeHours * 3600000)
    throw Error('Sauvegarde absente ou trop ancienne : ' + markerKey);
  const target = status.manifestKey || status.objectKey;
  if (!target) throw Error('Marqueur sans objet de sauvegarde');
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: target }));
  if (!(head.ContentLength > 0)) throw Error('Objet de sauvegarde vide');
  return status;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const client = r2Client(),
    bucket = process.env.R2_BACKUP_BUCKET || 'soralink-backups';
  try {
    if (process.argv.includes('--check')) {
      await checkFreshness(client, bucket, 'backups/files/latest.json');
      await checkFreshness(client, bucket, 'backups/soralink-db/latest.json');
      console.log('Sauvegardes D1 et R2 présentes et récentes.');
    } else {
      const result = await backupFiles({
        source: client,
        destination: client,
        sourceBucket: process.env.R2_SOURCE_BUCKET || 'soralink-files',
        backupBucket: bucket,
        key: encryptionKey(process.env.BACKUP_ENCRYPTION_KEY),
      });
      console.log(
        `Sauvegarde R2 vérifiée : ${result.files} objets, manifeste ${result.manifestKey}`,
      );
    }
  } finally {
    client.destroy();
  }
}
