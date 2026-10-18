const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const { Miniflare } = createRequire(require.resolve('wrangler'))('miniflare');
const migration = fs.readFileSync(path.resolve('drizzle/0004_profile_media.sql'), 'utf8');
const statements = migration.split('--> statement-breakpoint').map((s) => s.trim());
const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const url = (key) => '/api/upload?key=' + key;
let mf, db, media;
let deleted = [];
let failDelete = false;
before(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default {fetch(){return new Response("ok")}}',
    d1Databases: { DB: 'media-index-tests' },
  });
  db = await mf.getD1Database('DB');
  await db.batch([
    db.prepare(
      "CREATE TABLE profiles(id TEXT PRIMARY KEY,owner TEXT NOT NULL UNIQUE,data TEXT NOT NULL,published INTEGER NOT NULL DEFAULT 0,updated TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',expires TEXT)",
    ),
    db.prepare(
      'CREATE TABLE media_assets(key TEXT PRIMARY KEY,owner TEXT NOT NULL,bytes INTEGER NOT NULL,state TEXT NOT NULL,created TEXT NOT NULL)',
    ),
    db.prepare('CREATE INDEX media_owner_state ON media_assets(owner,state)'),
  ]);
  await db.batch(statements.map((sql) => db.prepare(sql)));
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('app/lib/media-storage.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    {
      module,
      exports: module.exports,
      Date,
      Set,
      require: (name) => {
        if (name === './subscription') return { trialExpiry: () => '2026-12-31T00:00:00Z' };
        if (name === './server') return { db: () => db };
        if (name === 'cloudflare:workers')
          return {
            env: {
              BUCKET: {
                delete: async (key) => {
                  if (failDelete) throw Error('R2 unavailable');
                  deleted.push(key);
                },
              },
            },
          };
        throw Error('Unexpected import ' + name);
      },
    },
  );
  media = module.exports;
});
beforeEach(async () => {
  deleted = [];
  failDelete = false;
  await db.batch([db.prepare('DELETE FROM profiles'), db.prepare('DELETE FROM media_assets')]);
});
after(async () => {
  await mf?.dispose();
});
async function asset(key, owner = 'owner', state = 'ready', created = '2020-01-01T00:00:00.000Z') {
  await db
    .prepare('INSERT INTO media_assets VALUES(?,?,?,?,?)')
    .bind(key, owner, 100, state, created)
    .run();
}
async function profile(id = 'card', owner = 'owner', data = {}) {
  await db
    .prepare('INSERT INTO profiles(id,owner,data,published,updated,email) VALUES(?,?,?,?,?,?)')
    .bind(id, owner, JSON.stringify(data), 1, 'old', 'test@example.test')
    .run();
  return db.prepare('SELECT * FROM profiles WHERE id=?').bind(id).first();
}
async function keys(id = 'card') {
  return (
    await db
      .prepare('SELECT media_key FROM profile_media WHERE profile_id=? ORDER BY media_key')
      .bind(id)
      .all()
  ).results.map((r) => r.media_key);
}
async function state(key) {
  return (await db.prepare('SELECT state FROM media_assets WHERE key=?').bind(key).first()).state;
}

test('references include hidden/nested media, multiple absolute/embedded links, and deduplicate', async () => {
  await profile('card', 'owner', {
    avatar: url(A),
    cover: url(A),
    photos: [url(B)],
    services: [{ image: url(C) }],
    promotions: [{ image: url(A) }],
    hideAvatar: true,
    note: 'https://soralink.link' + url(B) + ' puis https://soralink.link' + url(C),
    ignored: url('not-a-key'),
  });
  assert.deepEqual(await keys(), [A, B, C]);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM profile_media').first()).n, 3);
});
test('migration backfills existing profiles and can be reapplied', async () => {
  await profile('card', 'owner', { recordedVideo: url(A), pdf: url(B) });
  await db.prepare('DELETE FROM profile_media').run();
  await db.batch(statements.map((sql) => db.prepare(sql)));
  await db.batch(statements.map((sql) => db.prepare(sql)));
  assert.deepEqual(await keys(), [A, B]);
});
test('cleanup preserves referenced files and recent uploads, deletes only old unreferenced files', async () => {
  await asset(A);
  await asset(B);
  await asset(C, 'owner', 'pending', new Date().toISOString());
  await profile('card', 'owner', { avatar: url(A) });
  assert.equal(await media.cleanupMedia('owner'), true);
  assert.deepEqual(deleted, [B]);
  assert.equal(await state(A), 'ready');
  assert.equal(await state(C), 'pending');
});
test('save atomically updates references and handles D1 trigger write counts', async () => {
  await asset(A);
  await asset(B);
  const old = await profile('card', 'owner', { avatar: url(A) });
  assert.equal(
    await media.saveProfileWithMedia(
      'owner',
      old,
      'card',
      { avatar: url(B) },
      true,
      'test@example.test',
    ),
    true,
  );
  assert.deepEqual(await keys(), [B]);
  assert.equal(await state(A), 'deleting');
  await media.cleanupMedia('owner');
  assert.deepEqual(deleted, [A]);
});
test('two simultaneous saves from the same version accept exactly one and preserve its media', async () => {
  await asset(A);
  await asset(B);
  await asset(C);
  const old = await profile('card', 'owner', { avatar: url(A) });
  const results = await Promise.all([
    media.saveProfileWithMedia('owner', old, 'card', { avatar: url(B) }, true, ''),
    media.saveProfileWithMedia('owner', old, 'card', { avatar: url(C) }, true, ''),
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  const winner = results[0] ? B : C;
  assert.deepEqual(await keys(), [winner]);
  assert.equal(await state(winner), 'ready');
  await media.cleanupMedia('owner');
  assert(!deleted.includes(winner));
});
test('a file shared by two profiles is protected until both remove it', async () => {
  await asset(A);
  const first = await profile('one', 'owner', { avatar: url(A) });
  const second = await profile('two', 'other', { cover: url(A) });
  assert.equal(await media.saveProfileWithMedia('owner', first, 'one', {}, true, ''), true);
  assert.equal(await state(A), 'ready');
  await media.cleanupMedia('owner');
  assert.deepEqual(deleted, []);
  assert.equal(await media.saveProfileWithMedia('other', second, 'two', {}, true, ''), true);
  await media.cleanupMedia('owner');
  assert.deepEqual(deleted, [A]);
});
test('cleanup winning a race prevents a stale save from attaching the deleting media', async () => {
  await asset(A, 'owner', 'deleting');
  const old = await profile();
  assert.equal(
    await media.saveProfileWithMedia('owner', old, 'card', { avatar: url(A) }, true, ''),
    false,
  );
  assert.deepEqual(await keys(), []);
  assert.equal(
    (await db.prepare('SELECT data FROM profiles WHERE id=?').bind('card').first()).data,
    '{}',
  );
});
test('embedded links cannot reattach deleting media and failure rolls back the profile', async () => {
  await asset(A, 'owner', 'deleting');
  const old = await profile();
  await assert.rejects(
    media.saveProfileWithMedia(
      'owner',
      old,
      'card',
      { bio: 'Voir https://soralink.link' + url(A) },
      true,
      '',
    ),
  );
  assert.deepEqual(await keys(), []);
  assert.equal(
    (await db.prepare('SELECT data FROM profiles WHERE id=?').bind('card').first()).data,
    '{}',
  );
});
test('failed R2 deletion stays retryable and referenced deleting media is protected', async () => {
  await asset(A);
  await asset(B);
  await profile('card', 'owner', { avatar: url(B) });
  await db.prepare("UPDATE media_assets SET state='deleting' WHERE key=?").bind(B).run();
  failDelete = true;
  assert.equal(await media.cleanupMedia('owner'), false);
  assert.equal(await state(A), 'deleting');
  failDelete = false;
  assert.equal(await media.cleanupMedia('owner'), true);
  assert.deepEqual(deleted, [A]);
  assert.equal(await state(B), 'deleting');
});
test('profile deletion cascades its references and lookup uses the media key index', async () => {
  await profile('card', 'owner', { avatar: url(A) });
  await db.prepare('DELETE FROM profiles WHERE id=?').bind('card').run();
  assert.deepEqual(await keys(), []);
  const plan = (
    await db
      .prepare(
        'EXPLAIN QUERY PLAN SELECT key FROM media_assets WHERE owner=? AND NOT EXISTS(SELECT 1 FROM profile_media WHERE media_key=media_assets.key)',
      )
      .bind('owner')
      .all()
  ).results;
  assert(plan.some((r) => r.detail.includes('profile_media_key')));
  assert(!plan.some((r) => /SCAN profiles/.test(r.detail)));
});

test('concurrent cleanup and save cannot delete a file accepted by the profile save', async () => {
  await asset(A);
  const old = await profile();
  const [saved] = await Promise.all([
    media.saveProfileWithMedia('owner', old, 'card', { avatar: url(A) }, true, ''),
    media.cleanupMedia('owner'),
  ]);
  if (saved) {
    assert.deepEqual(await keys(), [A]);
    assert.equal(await state(A), 'ready');
    assert(!deleted.includes(A));
  } else {
    assert.deepEqual(await keys(), []);
    assert.equal(await state(A), 'deleted');
  }
});

test('background photos are protected media references and cannot use another account upload', async () => {
  await asset(A);
  await asset(B, 'other');
  assert.equal(await media.validateMedia('owner', { backgroundPhoto: url(B) }, {}), false);
  assert.equal(await media.validateMedia('owner', { backgroundPhoto: url(A) }, {}), true);
  const old = await profile('card', 'owner', {});
  assert.equal(
    await media.saveProfileWithMedia(
      'owner',
      old,
      'card',
      { backgroundPhoto: url(A), backgroundOpacity: 0 },
      true,
      '',
    ),
    true,
  );
  assert.deepEqual(await keys(), [A]);
  await media.cleanupMedia('owner');
  assert.equal(await state(A), 'ready');
});

test('multiple catalogue PDFs, covers, galleries and thumbnails remain owned and protected even when hidden', async () => {
  await asset(A);
  await asset(B);
  await asset(C);
  const data = {
    catalogDocuments: [{ src: url(A), cover: url(B), visible: false }],
    services: [{ image: url(B), images: [url(C)], thumbnail: url(A), availability: 'hidden' }],
  };
  assert.deepEqual(Array.from(media.mediaKeys(data)).sort(), [A, B, C]);
  assert.equal(await media.validateMedia('other', data, {}), false);
  const old = await profile('card', 'owner', {});
  assert.equal(await media.saveProfileWithMedia('owner', old, 'card', data, false, ''), true);
  await media.cleanupMedia('owner');
  assert.deepEqual(deleted, []);
  assert.deepEqual(await keys(), [A, B, C]);
});
test('concurrent reservations cannot exceed an administrator file quota', async () => {
  const limit = { storageMB: 1, maxFiles: 1 };
  const result = await Promise.all([
    media.reserveMedia('owner', A, 100, limit),
    media.reserveMedia('owner', B, 100, limit),
  ]);
  assert.equal(result.filter(Boolean).length, 1);
  assert.equal((await media.storageUsage('owner', limit)).files, 1);
  assert.equal((await media.storageUsage('owner', limit)).limitFiles, 1);
});
test('pending file sizes count toward an administrator storage quota', async () => {
  const limit = { storageMB: 1, maxFiles: 20 };
  assert.equal(await media.reserveMedia('owner', A, 700000, limit), true);
  assert.equal(await media.reserveMedia('owner', B, 700000, limit), false);
  assert.equal((await media.storageUsage('owner', limit)).bytes, 700000);
});

test('offer gallery and video references enforce ownership and remain indexed through saves', async () => {
  await asset(A);
  await asset(B);
  await asset(C, 'another-owner');
  const previous = await profile('card', 'owner', {});
  const data = {
    promotions: [
      { id: 'offer', title: 'Pack', enabled: false, images: [url(A)], recordedVideo: url(B) },
    ],
  };
  assert.deepEqual([...media.mediaKeys(data)].sort(), [A, B]);
  assert.equal(await media.validateMedia('owner', data, {}), true);
  assert.equal(
    await media.validateMedia('owner', { promotions: [{ recordedVideo: url(C) }] }, {}),
    false,
  );
  assert.equal(
    await media.validateMedia('owner', { promotions: [{ images: [url(C)] }] }, {}),
    false,
  );
  assert.equal(
    await media.saveProfileWithMedia(
      'owner',
      previous,
      'card',
      data,
      true,
      'test@example.test',
      'new',
    ),
    true,
  );
  assert.deepEqual(await keys(), [A, B]);
  await media.cleanupMedia('owner');
  assert.equal(await state(A), 'ready');
  assert.equal(await state(B), 'ready');
});
