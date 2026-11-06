const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { load } = require('./ts-loader.cjs');

const { renewalNotice, renewalStatement, sendRenewalReminders } = load(
  path.resolve('app/lib/renewal.ts'),
);
const DAY = 86400000;
const NOW = Date.parse('2026-11-06T12:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE requests(id TEXT PRIMARY KEY)');
  for (const statement of fs
    .readFileSync('drizzle/0002_ambiguous_donald_blake.sql', 'utf8')
    .split('--> statement-breakpoint'))
    if (statement.trim()) sqlite.exec(statement);
  sqlite.exec(
    'CREATE TABLE profiles(id TEXT PRIMARY KEY, email TEXT NOT NULL, state TEXT NOT NULL, plan TEXT NOT NULL, expires TEXT, data TEXT NOT NULL)',
  );
  const database = {
    prepare(sql) {
      let params = [];
      return {
        bind(...values) {
          params = values;
          return this;
        },
        async first() {
          return sqlite.prepare(sql).get(...params) || null;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...params) };
        },
        async run() {
          const result = sqlite.prepare(sql).run(...params);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
  };
  const env = {
    DB: database,
    NOTIFICATIONS_ENABLED: 'true',
    RESEND_API_KEY: 'fake',
    EMAIL_FROM: 'test@example.test',
    PUBLIC_SITE_URL: 'https://example.test',
  };
  const profile = (id, expires, overrides = {}) => {
    sqlite
      .prepare('INSERT INTO profiles(id,email,state,plan,expires,data) VALUES(?,?,?,?,?,?)')
      .run(
        id,
        'owner@example.test',
        overrides.state || 'active',
        'Digital',
        expires,
        JSON.stringify({ business: 'Atelier ' + id, defaultLanguage: 'fr' }),
      );
  };
  return { sqlite, env, profile };
}

test('renewal stages follow the subscription rules', () => {
  const empty = renewalNotice(null, NOW);
  assert.equal(empty.stage, 'none');
  assert.equal(empty.days, 0);
  assert.equal(renewalNotice({ state: 'active', expires: iso(NOW + 30 * DAY) }, NOW).stage, 'none');
  const soon = renewalNotice({ state: 'active', expires: iso(NOW + 5 * DAY) }, NOW);
  assert.equal(soon.stage, 'soon');
  assert.equal(soon.days, 5);
  const grace = renewalNotice({ state: 'active', expires: iso(NOW - 3 * DAY) }, NOW);
  assert.equal(grace.stage, 'grace');
  assert.equal(grace.days, 12);
  assert.ok(grace.until);
  assert.equal(
    renewalNotice({ state: 'active', expires: iso(NOW - 20 * DAY) }, NOW).stage,
    'expired',
  );
  // A trial has no grace period.
  assert.equal(renewalNotice({ state: 'trial', expires: iso(NOW - DAY) }, NOW).stage, 'expired');
});

test('a reminder is queued once per stage and contains the expiry date', async () => {
  const f = fixture();
  try {
    const expires = iso(NOW + 5 * DAY);
    f.profile('atelier', expires);
    const row = f.sqlite.prepare('SELECT * FROM profiles WHERE id=?').get('atelier');
    const notice = renewalNotice(row, NOW);
    const [statement] = renewalStatement(f.env, row, notice, iso(NOW));
    assert.equal((await statement.run()).meta.changes, 1);
    const saved = f.sqlite.prepare('SELECT * FROM notifications').get();
    assert.equal(saved.recipient, 'owner@example.test');
    assert.match(saved.subject, /expire dans 5 jours/);
    assert.match(saved.body, new RegExp(expires.slice(0, 10)));
    const again = renewalStatement(f.env, row, notice, iso(NOW + 60000))[0];
    assert.equal((await again.run()).meta.changes, 0);
  } finally {
    f.sqlite.close();
  }
});

test('the scheduled sweep only queues profiles inside a reminder window', async () => {
  const f = fixture();
  try {
    f.profile('sept', iso(NOW + 7 * DAY));
    f.profile('trente', iso(NOW + 30 * DAY));
    f.profile('grace', iso(NOW - 2 * DAY));
    assert.equal(await sendRenewalReminders(f.env, NOW), 2);
    assert.equal(await sendRenewalReminders(f.env, NOW), 0);
    const rows = f.sqlite.prepare('SELECT profile FROM notifications ORDER BY profile').all();
    assert.deepEqual(
      rows.map((r) => r.profile),
      ['grace', 'sept'],
    );
  } finally {
    f.sqlite.close();
  }
});
