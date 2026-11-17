const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { dataActionSchema, dataQuerySchema } = load(path.resolve('app/lib/api-validation.ts'));

test('multi-card: dataActionSchema validates createCard and targeted save', () => {
  assert.equal(
    dataActionSchema.safeParse({
      action: 'createCard',
      name: 'Deuxième carte',
    }).success,
    true,
  );
  assert.equal(
    dataActionSchema.safeParse({
      action: 'createCard',
    }).success,
    true,
  );
  assert.equal(
    dataActionSchema.safeParse({
      action: 'createCard',
      name: 'a'.repeat(200),
    }).success,
    false,
  );
  assert.equal(
    dataActionSchema.safeParse({
      action: 'save',
      id: '11111111-1111-4111-8111-111111111111',
      data: { name: 'Card 2' },
      revision: null,
      published: false,
    }).success,
    true,
  );
});

test('multi-card: dataQuerySchema validates cardId query parameter', () => {
  const query = dataQuerySchema.safeParse({
    cardId: '11111111-1111-4111-8111-111111111111',
  });
  assert.equal(query.success, true);
  assert.equal(query.data.cardId, '11111111-1111-4111-8111-111111111111');
  assert.equal(dataQuerySchema.safeParse({ cardId: '' }).success, false);
  assert.equal(dataQuerySchema.safeParse({ cardId: 'a'.repeat(200) }).success, false);
});

test('multi-card: reservePublicName checks both profiles and secondary_cards', async () => {
  const { reservePublicName } = load(path.resolve('app/lib/address-storage.ts'));
  const executedStatements = [];
  const mockDb = {
    prepare(sql) {
      return {
        bind(...args) {
          executedStatements.push({ sql, args });
          return this;
        },
      };
    },
    async batch(stmts) {
      return [{ meta: { changes: 1 } }, { meta: { changes: 1 } }];
    },
  };
  const res = await reservePublicName(mockDb, 'owner-1', 'card-sec-1', 'my-shop');
  assert.equal(res, true);
  assert.equal(executedStatements.length, 2);
  assert.match(executedStatements[0].sql, /secondary_cards/);
  assert.match(executedStatements[1].sql, /secondary_cards/);
});

test('card registry migration preserves primary history and enables secondary foreign keys without accepting unknown cards', () => {
  const fs = require('node:fs'),
    { DatabaseSync } = require('node:sqlite');
  const sqlite = new DatabaseSync(':memory:');
  try {
    for (const name of fs
      .readdirSync('drizzle')
      .filter((n) => /^\d{4}.*\.sql$/.test(n) && !n.startsWith('0019'))
      .sort())
      sqlite.exec(fs.readFileSync('drizzle/' + name, 'utf8'));
    sqlite.exec(
      "INSERT INTO profiles(id,owner,data,published,updated) VALUES('p','owner','{}',1,'old'); INSERT INTO secondary_cards(id,owner,data,published,updated,created) VALUES('s','owner','{}',1,'old','old'); INSERT INTO profile_metrics VALUES('p','2026-11-17','qr',9); INSERT INTO profile_addresses VALUES('primary-name','p',1,'old'); INSERT INTO catalog_order_intents VALUES('intent','p','request','hash','visitor','old');",
    );
    sqlite.exec(fs.readFileSync('drizzle/0019_card_registry.sql', 'utf8'));
    assert.equal(sqlite.prepare('SELECT visits FROM profile_metrics').get().visits, 9);
    assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM catalog_order_intents').get().n, 1);
    sqlite.exec(
      "INSERT INTO profile_addresses VALUES('secondary-name','s',1,'old'); INSERT INTO profile_metrics VALUES('s','2026-11-17','qr',2)",
    );
    assert.throws(() =>
      sqlite.exec("INSERT INTO profile_metrics VALUES('unknown','2026-11-17','qr',1)"),
    );
    assert.equal(sqlite.prepare('PRAGMA foreign_key_check').all().length, 0);
  } finally {
    sqlite.close();
  }
});
