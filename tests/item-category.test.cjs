const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');
const { load } = require('./ts-loader.cjs');
const { assignItemCategory, saveItemCategory, removeItemCategory } = load(
  path.resolve('app/lib/item-category.ts'),
);
const { catalogContentIssue, catalogRights } = load(path.resolve('app/lib/catalog-menu.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const initial = {
  name: 'Card',
  bio: 'Keep this',
  services: [{ id: 'article', name: 'Article', nameFr: 'Article', price: '25' }],
  catalogCategories: [],
};
const rights = catalogRights({ state: 'trial' });
test('creating a category from an article assigns it atomically and keeps valid saved data', () => {
  const out = saveItemCategory(initial, 'article', 'Fr', '  Cadeaux  ', '', 'gifts');
  assert.equal(out.catalogCategories[0].nameFr, 'Cadeaux');
  assert.equal(out.catalogCategories[0].nameAr, '');
  assert.equal(out.services[0].categoryId, 'gifts');
  assert.equal(out.services[0].price, '25');
  assert.equal(out.bio, initial.bio);
  assert.equal(initial.catalogCategories.length, 0);
  assert.equal(profileDataSchema.safeParse(out).success, true);
  assert.equal(catalogContentIssue(out, initial, rights), '');
});
test('the Arabic category name is saved separately without an automatic translation', () => {
  const out = saveItemCategory(initial, 'article', 'Ar', 'هدايا', '', 'gifts');
  assert.equal(out.catalogCategories[0].nameFr, '');
  assert.equal(out.catalogCategories[0].nameAr, 'هدايا');
});
test('reuse existing names, preserve translations, and reject invalid or stale edits', () => {
  const data = saveItemCategory(initial, 'article', 'Fr', 'Cadeaux', '', 'gifts');
  data.catalogCategories[0].nameAr = 'هدايا';
  const reused = saveItemCategory(data, 'article', 'Fr', ' cadeaux ', '', 'unused');
  assert.equal(reused.catalogCategories.length, 1);
  assert.equal(reused.services[0].categoryId, 'gifts');
  const renamed = saveItemCategory(data, 'article', 'Fr', 'Objets', 'gifts');
  assert.equal(renamed.catalogCategories[0].nameAr, 'هدايا');
  assert.equal(renamed.catalogCategories[0].nameFr, 'Objets');
  for (const value of ['', ' ', 'x'.repeat(121)]) {
    assert.equal(saveItemCategory(data, 'article', 'Fr', value), data);
  }
  assert.equal(saveItemCategory(data, 'missing', 'Fr', 'X'), data);
  assert.equal(saveItemCategory(data, 'article', 'Fr', 'X', 'missing'), data);
  assert.equal(assignItemCategory(data, 'article', 'missing'), data);
});
test('removing a shared category clears its references without deleting articles', () => {
  const data = saveItemCategory(initial, 'article', 'Fr', 'Cadeaux', '', 'gifts');
  data.services.push({ ...data.services[0], id: 'second', name: 'Second' });
  data.services.push({ ...data.services[0], id: 'other', categoryId: '', category: 'Legacy' });
  const out = removeItemCategory(data, 'gifts');
  assert.equal(out.catalogCategories.length, 0);
  assert.equal(out.services.length, 3);
  assert.equal(out.services[0].categoryId, '');
  assert.equal(out.services[1].categoryId, '');
  assert.equal(out.services[2].category, 'Legacy');
  assert.equal(out.bio, initial.bio);
  assert.equal(catalogContentIssue(out, data, rights), '');
  const cleared = assignItemCategory(data, 'other', '');
  assert.equal(cleared.services[2].category, '');
});
test('category limits block only new categories and never prevent reuse', () => {
  const data = {
    ...initial,
    catalogCategories: Array.from({ length: 40 }, (_, i) => ({
      id: 'c' + i,
      nameFr: 'Cat ' + i,
      nameAr: '',
      visible: true,
    })),
  };
  assert.equal(saveItemCategory(data, 'article', 'Fr', 'New', '', 'extra'), data);
  const reused = saveItemCategory(data, 'article', 'Fr', 'Cat 0');
  assert.equal(reused.services[0].categoryId, 'c0');
});
test('migration upgrades saved ten-article quotas while preserving other account controls', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE profiles (id TEXT, catalog_rights TEXT)');
    const rows = [
      ['old', JSON.stringify({ maxProducts: 10, enabled: false, maxDocuments: 2 })],
      ['custom', JSON.stringify({ maxProducts: 1, enabled: true })],
      ['disabled', JSON.stringify({ maxProducts: 0 })],
      ['default', null],
      ['invalid', 'invalid JSON'],
    ];
    for (const [id, raw] of rows) {
      db.prepare('INSERT INTO profiles VALUES (?,?)').run(id, raw);
    }
    db.exec(fs.readFileSync('drizzle/0009_catalogue_forty.sql', 'utf8'));
    const old = JSON.parse(
      db.prepare("SELECT catalog_rights FROM profiles WHERE id='old'").get().catalog_rights,
    );
    assert.equal(old.maxProducts, 40);
    assert.equal(old.enabled, false);
    assert.equal(old.maxDocuments, 2);
    for (const [id, raw] of rows.slice(1)) {
      assert.equal(
        db.prepare('SELECT catalog_rights FROM profiles WHERE id=?').get(id).catalog_rights,
        raw,
      );
    }
  } finally {
    db.close();
  }
});
