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
