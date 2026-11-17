const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { createHash } = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = () =>
  Promise.all(
    ['backup-r2', 'restore-r2'].map(
      (n) => import(pathToFileURL(path.resolve('scripts/' + n + '.mjs')).href),
    ),
  );
const hash = (b) => createHash('sha256').update(b).digest('hex');
async function bytes(value) {
  if (typeof value === 'string' || Buffer.isBuffer(value) || value instanceof Uint8Array)
    return Buffer.from(value);
  const chunks = [];
  for await (const chunk of value) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}
function fixture() {
  const buckets = new Map(['files', 'backups', 'rehearsal'].map((k) => [k, new Map()]));
  let listings = 0;
  const put = (bucket, key, body, metadata = {}) =>
    buckets.get(bucket).set(key, { body: Buffer.from(body), ...metadata });
  const client = {
    async send(command) {
      const input = command.input,
        bucket = buckets.get(input.Bucket);
      switch (command.constructor.name) {
        case 'ListObjectsV2Command': {
          listings++;
          const entries = [...bucket],
            offset = Number(input.ContinuationToken || 0),
            [key, value] = entries[offset] || [];
          return {
            Contents: key ? [{ Key: key, Size: value.body.length, ETag: hash(value.body) }] : [],
            IsTruncated: offset + 1 < entries.length,
            NextContinuationToken: String(offset + 1),
          };
        }
        case 'GetObjectCommand': {
          const entry = bucket.get(input.Key);
          if (!entry) throw Error('NoSuchKey');
          if (input.IfMatch && input.IfMatch !== hash(entry.body))
            throw Error('PreconditionFailed');
          const body = Readable.from([entry.body]);
          body.transformToString = async () => entry.body.toString();
          body.transformToByteArray = async () => entry.body;
          return { ...entry, Body: body, ContentLength: entry.body.length, ETag: hash(entry.body) };
        }
        case 'PutObjectCommand': {
          const body = await bytes(input.Body);
          const meta = { ...input };
          delete meta.Body;
          put(input.Bucket, input.Key, body, meta);
          return {};
        }
        case 'HeadObjectCommand': {
          const entry = bucket.get(input.Key);
          if (!entry) throw Error('NoSuchKey');
          return { ...entry, ContentLength: entry.body.length };
        }
        default:
          throw Error('Unexpected ' + command.constructor.name);
      }
    },
  };
  return { buckets, put, client, listings: () => listings };
}

test('R2 backup paginates, encrypts keys and metadata, restores exact bytes, and never changes source', async () => {
  const [{ backupFiles, encryptionKey, unseal }, { restoreFiles }] = await load(),
    f = fixture(),
    key = encryptionKey('a'.repeat(64));
  f.put('files', 'receipts/private.pdf', Buffer.from('%PDF-confidentiel'), {
    ContentType: 'application/pdf',
    Metadata: { pages: '2' },
    CacheControl: 'private, no-store',
  });
  f.put('files', 'photo', Buffer.from([0, 1, 2, 255]), {
    ContentType: 'image/png',
    ContentDisposition: 'inline',
    ContentLanguage: 'fr',
  });
  const result = await backupFiles({
    source: f.client,
    destination: f.client,
    sourceBucket: 'files',
    backupBucket: 'backups',
    key,
    prefix: 'backups/files/test',
  });
  assert.equal(result.files, 2);
  assert.equal(f.listings(), 2);
  assert.equal(f.buckets.get('files').size, 2);
  const encrypted = f.buckets.get('backups').get(result.manifestKey).body;
  assert(!encrypted.includes(Buffer.from('private.pdf')));
  const manifest = JSON.parse(unseal(encrypted, key));
  assert.equal(manifest.files[0].Metadata.pages, '2');
  assert.deepEqual(
    await restoreFiles({
      source: f.client,
      destination: f.client,
      backupBucket: 'backups',
      targetBucket: 'rehearsal',
      manifestKey: result.manifestKey,
      key,
    }),
    { files: 2 },
  );
  for (const [name, entry] of f.buckets.get('files')) {
    const restored = f.buckets.get('rehearsal').get(name);
    assert.deepEqual(restored.body, entry.body);
    assert.equal(restored.ContentType, entry.ContentType);
  }
  assert.equal(
    f.buckets.get('rehearsal').get('receipts/private.pdf').CacheControl,
    'private, no-store',
  );
});

test('R2 restore rejects altered ciphertext, wrong keys and unsafe targets before publishing corrupt data', async () => {
  const [{ backupFiles, encryptionKey }, { restoreFiles }] = await load(),
    f = fixture(),
    key = encryptionKey('b'.repeat(64));
  f.put('files', 'one', Buffer.from('private'));
  const { manifestKey } = await backupFiles({
    source: f.client,
    destination: f.client,
    sourceBucket: 'files',
    backupBucket: 'backups',
    key,
    prefix: 'backups/files/corrupt',
  });
  const options = {
    source: f.client,
    destination: f.client,
    backupBucket: 'backups',
    targetBucket: 'rehearsal',
    manifestKey,
    key,
  };
  await assert.rejects(restoreFiles({ ...options, targetBucket: 'files' }));
  await assert.rejects(restoreFiles({ ...options, key: encryptionKey('c'.repeat(64)) }));
  const object = f.buckets.get('backups').get('backups/files/corrupt/objects/0.enc').body;
  object[object.length - 1] ^= 1;
  await assert.rejects(restoreFiles(options));
  assert.equal(f.buckets.get('rehearsal').size, 0);
});

test('incomplete backups cannot publish a success marker and freshness rejects missing or stale copies', async () => {
  const [{ backupFiles, checkFreshness, encryptionKey }] = await load(),
    f = fixture(),
    key = encryptionKey('d'.repeat(64));
  f.put('files', 'one', 'data');
  const failing = {
    send(c) {
      if (c.constructor.name === 'PutObjectCommand') throw Error('Destination unavailable');
      return f.client.send(c);
    },
  };
  await assert.rejects(
    backupFiles({
      source: f.client,
      destination: failing,
      sourceBucket: 'files',
      backupBucket: 'backups',
      key,
    }),
  );
  assert(!f.buckets.get('backups').has('backups/files/latest.json'));
  await assert.rejects(checkFreshness(f.client, 'backups', 'backups/files/latest.json'));
  const { manifestKey } = await backupFiles({
    source: f.client,
    destination: f.client,
    sourceBucket: 'files',
    backupBucket: 'backups',
    key,
  });
  await checkFreshness(f.client, 'backups', 'backups/files/latest.json');
  f.put(
    'backups',
    'backups/files/latest.json',
    JSON.stringify({ completedAt: '2000-01-01', manifestKey }),
  );
  await assert.rejects(
    checkFreshness(f.client, 'backups', 'backups/files/latest.json'),
    /ancienne/,
  );
});
