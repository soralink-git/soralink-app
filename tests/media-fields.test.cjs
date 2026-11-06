const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');

const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));

const KEY = '0123abcd-4567-89ef-abcd-0123456789ab';
const MEDIA = '/api/upload?key=' + KEY;
const card = (extra = {}) => ({ name: 'Yahya', profileType: 'person', ...extra });
const valid = (data) => profileDataSchema.safeParse(data).success;

test('media fields accept only uploaded keys', () => {
  for (const field of ['avatar', 'cover', 'backgroundPhoto', 'pdf'])
    assert.equal(valid(card({ [field]: MEDIA })), true, field);
  assert.equal(valid(card({ avatar: '', cover: '', pdf: '', backgroundPhoto: '' })), true);
});

test('external, javascript: and data: URLs are rejected on save', () => {
  for (const field of ['avatar', 'cover', 'backgroundPhoto', 'pdf'])
    for (const value of [
      'https://example.test/photo.jpg',
      'javascript:alert(1)',
      'data:image/svg+xml,<svg onload=alert(1)>',
      '//evil.test/x.png',
    ])
      assert.equal(valid(card({ [field]: value })), false, field + ' ' + value);
});

test('public projection neutralises values already stored', () => {
  const saved = card({
    avatar: 'https://example.test/a.png',
    cover: 'javascript:alert(1)',
    backgroundPhoto: 'data:image/png;base64,AAAA',
    pdf: 'https://example.test/c.pdf',
  });
  const out = publicCardData(saved, false);
  assert.equal(out.avatar, '');
  assert.equal(out.cover, '');
  assert.equal(out.backgroundPhoto, '');
  assert.equal(out.pdf, '');
});

test('public projection keeps a valid uploaded key', () => {
  const out = publicCardData(card({ avatar: MEDIA, cover: MEDIA }), false);
  assert.equal(out.avatar, MEDIA);
  assert.equal(out.cover, MEDIA);
});
