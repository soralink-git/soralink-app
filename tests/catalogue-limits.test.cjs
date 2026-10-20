const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { MAX_CATALOGUE_ITEMS, catalogueLimit, catalogueError, normalizeCatalogue } = load(
  path.resolve('app/lib/catalogue.ts'),
);
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const items = Array.from({ length: 40 }, (_, i) => ({
  id: 'item-' + i,
  name: 'Article ' + i,
  description: 'D'.repeat(800),
  image: '/api/upload?key=12345678-1234-1234-1234-123456789abc',
  price: '20',
}));
test('trial and paid catalogues allow forty illustrated articles', () => {
  assert.equal(MAX_CATALOGUE_ITEMS, 40);
  assert.equal(catalogueLimit({ state: 'active' }), 40);
  assert.equal(catalogueLimit({ state: 'suspended' }), 40);
  assert.equal(catalogueLimit({ state: 'trial' }), 40);
  assert.equal(catalogueLimit(null), 40);
  assert.equal(catalogueError(items, 40), null);
  assert.equal(catalogueError(items, catalogueLimit({ state: 'trial' })), null);
  assert.match(catalogueError([...items, { name: 'Extra' }], catalogueLimit(null)), /40/);
  assert.equal(normalizeCatalogue(items).length, 40);
});
test('forty full descriptions fit; the schema allows admin overrides while default validation rejects forty-one', () => {
  const card = { name: 'Catalogue', services: items };
  assert(JSON.stringify(card).length > 35000);
  assert.equal(profileDataSchema.safeParse(card).success, true);
  assert.equal(
    profileDataSchema.safeParse({ ...card, services: [...items, { id: 'extra', name: 'Extra' }] })
      .success,
    true,
  );
  assert.match(catalogueError([...items, { name: 'Extra' }]), /40/);
});
