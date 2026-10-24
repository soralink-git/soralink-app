import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Miniflare } = createRequire(require.resolve('wrangler'))('miniflare');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const scratch = await mkdtemp(path.join(tmpdir(), 'soralink-recovery-'));
const mf = new Miniflare({
  modules: true,
  script: 'export default {fetch(){return new Response("isolated recovery rehearsal")}}',
  compatibilityDate: '2026-05-15',
  compatibilityFlags: ['nodejs_compat'],
  d1Databases: { SOURCE_DB: 'recovery-source', RESTORED_DB: 'recovery-restored' },
  r2Buckets: { SOURCE_FILES: 'recovery-source-files', RESTORED_FILES: 'recovery-restored-files' },
});
const profile = '11111111-1111-4111-8111-111111111111';
const imageKey = '22222222-2222-4222-8222-222222222222';
const pdfKey = '33333333-3333-4333-8333-333333333333';
const receiptKey = 'receipts/44444444-4444-4444-8444-444444444444';
const stamp = '2026-10-24T00:00:00.000Z';
try {
  const source = await mf.getD1Database('SOURCE_DB');
  const restored = await mf.getD1Database('RESTORED_DB');
  const files = await mf.getR2Bucket('SOURCE_FILES');
  const restoredFiles = await mf.getR2Bucket('RESTORED_FILES');
  for (const file of (await readdir('drizzle')).filter((f) => /^\d{4}.*\.sql$/.test(f)).sort())
    await source.batch(
      (await readFile('drizzle/' + file, 'utf8'))
        .split('--> statement-breakpoint')
        .filter((sql) => sql.trim())
        .map((sql) => source.prepare(sql)),
    );
  const data = {
    name: 'Atelier de test',
    avatar: '/api/upload?key=' + imageKey,
    catalogDocuments: [
      { id: pdfKey, src: '/api/upload?key=' + pdfKey, titleFr: 'Catalogue', titleAr: 'الكاتالوگ' },
    ],
  };
  await source
    .prepare(
      'INSERT INTO profiles(id,owner,data,published,updated,state,plan) VALUES(?,?,?,?,?,?,?)',
    )
    .bind(profile, 'recovery-owner', JSON.stringify(data), 1, stamp, 'active', 'Catalogue')
    .run();
  for (const key of [imageKey, pdfKey])
    await source
      .prepare('INSERT INTO media_assets(key,owner,bytes,state,created) VALUES(?,?,?,?,?)')
      .bind(key, 'recovery-owner', 30, 'ready', stamp)
      .run();
  await source
    .prepare('INSERT INTO orders(id,owner,plan,status,created) VALUES(?,?,?,?,?)')
    .bind('recovery-order', 'recovery-owner', 'Catalogue', 'pending', stamp)
    .run();
  await source
    .prepare(
      'INSERT INTO payment_receipts(id,order_id,owner,object_key,mime,bytes,created) VALUES(?,?,?,?,?,?,?)',
    )
    .bind(
      'recovery-receipt',
      'recovery-order',
      'recovery-owner',
      receiptKey,
      'application/pdf',
      30,
      stamp,
    )
    .run();
  await source
    .prepare(
      'INSERT INTO requests(id,profile,kind,name,phone,message,status,created) VALUES(?,?,?,?,?,?,?,?)',
    )
    .bind(
      'recovery-request',
      profile,
      'devis',
      'Client de test',
      '0600000000',
      'Demande de test',
      'new',
      stamp,
    )
    .run();
  await source
    .prepare('INSERT INTO profile_metrics(profile,day,source,visits) VALUES(?,?,?,?)')
    .bind(profile, '2026-10-24', 'qr', 3)
    .run();
  for (const [key, contentType] of [
    [imageKey, 'image/webp'],
    [pdfKey, 'application/pdf'],
    [receiptKey, 'application/pdf'],
  ])
    await files.put(key, new TextEncoder().encode('ISOLATED RECOVERY FIXTURE ' + key), {
      httpMetadata: { contentType, cacheControl: 'private, no-store' },
      customMetadata: { owner: 'recovery-owner', fixture: 'true' },
    });
  // Miniflare's SQL export path is also used by the pinned Wrangler local exporter.
  // It produces complete statements, including triggers containing semicolons.
  const dump = await source.prepare('PRAGMA miniflare_d1_export(?,?,?);').bind(0, 0).all();
  const statements = dump.results[0];
  assert(Array.isArray(statements) && statements.some((sql) => sql.includes('CREATE TRIGGER')));
  const sqlBytes = Buffer.from(JSON.stringify(statements));
  await writeFile(path.join(scratch, 'database.json'), sqlBytes, { mode: 0o600 });
  const manifest = { sqlSha256: sha(sqlBytes), files: [] };
  let cursor;
  do {
    const page = await files.list({ limit: 2, cursor });
    for (const entry of page.objects) {
      const object = await files.get(entry.key);
      assert(object);
      const bytes = Buffer.from(await object.arrayBuffer());
      const local = manifest.files.length + '.bin';
      await writeFile(path.join(scratch, local), bytes, { mode: 0o600 });
      manifest.files.push({
        key: entry.key,
        local,
        sha256: sha(bytes),
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata,
      });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const verify = (bytes, digest) =>
    assert.equal(sha(bytes), digest, 'Corrupted backup must be rejected before restore');
  assert.throws(() => verify(Buffer.from('corrupted'), manifest.sqlSha256));
  const savedSQL = await readFile(path.join(scratch, 'database.json'));
  verify(savedSQL, manifest.sqlSha256);
  for (const sql of JSON.parse(savedSQL.toString())) await restored.prepare(sql).run();
  for (const file of manifest.files) {
    const bytes = await readFile(path.join(scratch, file.local));
    verify(bytes, file.sha256);
    await restoredFiles.put(file.key, bytes, {
      httpMetadata: file.httpMetadata,
      customMetadata: file.customMetadata,
    });
    const object = await restoredFiles.get(file.key);
    assert(object);
    verify(Buffer.from(await object.arrayBuffer()), file.sha256);
    assert.deepEqual(object.httpMetadata, file.httpMetadata);
    assert.deepEqual(object.customMetadata, file.customMetadata);
  }
  const schemaSQL =
    "SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%' ORDER BY type,name";
  const originalSchema = (await source.prepare(schemaSQL).all()).results;
  const restoredSchema = (await restored.prepare(schemaSQL).all()).results;
  assert.deepEqual(restoredSchema, originalSchema);
  const tables = originalSchema.filter((row) => row.type === 'table');
  for (const { name } of tables) {
    const quoted = '"' + name.replaceAll('"', '""') + '"';
    const rows = async (db) =>
      (await db.prepare('SELECT * FROM ' + quoted).all()).results
        .map((row) => JSON.stringify(row))
        .sort();
    assert.deepEqual(
      await rows(restored),
      await rows(source),
      name + ' data must be restored exactly',
    );
  }
  assert.equal((await restored.prepare('PRAGMA foreign_key_check').all()).results.length, 0);
  await assert.rejects(
    restored
      .prepare('INSERT INTO profiles(id,owner,data,published,updated) VALUES(?,?,?,?,?)')
      .bind('duplicate-owner', 'recovery-owner', '{}', 0, stamp)
      .run(),
  );
  await restored
    .prepare('UPDATE profiles SET data=? WHERE id=?')
    .bind(JSON.stringify({ name: 'Updated fixture' }), profile)
    .run();
  assert.equal(
    (await restored.prepare('SELECT * FROM profile_media WHERE profile_id=?').bind(profile).all())
      .results.length,
    0,
  );
  assert.equal((await files.list()).objects.length, 3);
  console.log(
    `Recovery verified: ${tables.length} tables, schema/indexes/triggers, exact fixture rows, ${manifest.files.length} paginated R2 objects with bytes/metadata, corruption detection, ownership uniqueness and restored media-reference trigger.`,
  );
  console.log(
    'Isolated synthetic data only. Production Time Travel, remote SQL export and a full production R2 restore are not exercised by this rehearsal.',
  );
} finally {
  await mf.dispose();
  await rm(scratch, { recursive: true, force: true });
}
