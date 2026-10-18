const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { associateLegacyMedia, normalizePromotions, promotionError } = load(
  path.resolve('app/lib/promotions.ts'),
);
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const { catalogRights, catalogContentIssue } = load(path.resolve('app/lib/catalog-menu.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const url = '/api/upload?key=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const second = '/api/upload?key=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const offer = {
  id: 'offer',
  title: 'Pack',
  enabled: true,
  image: url,
  images: [second],
  recordedVideo: second,
  video: 'https://youtu.be/abcdefghijk',
};
test('offer media survives normalization and validated saves, while malformed or oversized media is rejected', () => {
  const normalized = normalizePromotions([offer])[0];
  assert.equal(normalized.images[0], second);
  assert.equal(normalized.recordedVideo, second);
  assert.equal(normalized.video, offer.video);
  assert.equal(profileDataSchema.safeParse({ name: 'Test', promotions: [offer] }).success, true);
  for (const change of [
    { images: Array(11).fill(url) },
    { images: ['https://evil.test/a.png'] },
    { recordedVideo: 'https://evil.test/a.mp4' },
    { video: 'https://evil.test/watch?v=abcdefghijk' },
    { video: 'javascript:alert(1)' },
  ]) {
    assert.ok(promotionError([{ ...offer, ...change }]));
    assert.equal(
      profileDataSchema.safeParse({ name: 'Test', promotions: [{ ...offer, ...change }] }).success,
      false,
    );
  }
});
test('unattached, inactive, expired and disabled offer assets are excluded from the public projection', () => {
  const data = {
    name: 'Test',
    photos: [url],
    recordedVideo: url,
    video: offer.video,
    promotions: [offer],
  };
  const projection = publicCardData(data, false);
  assert.equal(projection.photos.length, 0);
  assert.equal(projection.recordedVideo, '');
  assert.equal(projection.video, '');
  assert.equal(projection.promotions[0].recordedVideo, second);
  for (const change of [
    { promotions: [{ ...offer, enabled: false }] },
    { promotions: [{ ...offer, endDate: '2020-01-01' }] },
    { promotions: [{ ...offer, startDate: '2099-01-01' }] },
    { hiddenSections: ['promotions'] },
    { catalogSettings: { enabled: false } },
  ])
    assert.equal(publicCardData({ ...data, ...change }, false).promotions.length, 0);
  assert.equal(
    publicCardData(data, false, { ...catalogRights(), enabled: false }).promotions.length,
    0,
  );
});
test('explicit legacy media association moves only the selected file and never overwrites an existing video', () => {
  const data = {
    name: 'Test',
    photos: [url, second],
    recordedVideo: second,
    video: offer.video,
    promotions: [{ id: 'offer', title: 'Pack', enabled: false, image: '', images: [] }],
  };
  assert.equal(associateLegacyMedia(data, 'missing', 'photo', url), null);
  const next = associateLegacyMedia(data, 'offer', 'photo', url);
  assert.equal(next.photos.length, 1);
  assert.equal(next.promotions[0].image, url);
  assert.equal(next.promotions[0].enabled, false);
  assert.equal(data.photos.length, 2);
  const gallery = associateLegacyMedia(next, 'offer', 'photo', second);
  assert.equal(gallery.photos.length, 0);
  assert.equal(gallery.promotions[0].images[0], second);
  const video = associateLegacyMedia(data, 'offer', 'recordedVideo', second);
  assert.equal(video.recordedVideo, '');
  assert.equal(video.promotions[0].recordedVideo, second);
  const occupied = { ...data, promotions: [{ ...data.promotions[0], recordedVideo: url }] };
  assert.equal(associateLegacyMedia(occupied, 'offer', 'recordedVideo', second), null);
  const full = {
    ...data,
    promotions: [{ ...data.promotions[0], image: second, images: Array(10).fill(second) }],
  };
  assert.equal(associateLegacyMedia(full, 'offer', 'photo', url), null);
});
test('disabled catalogues reject offer edits on the server while unrelated retained content remains saveable', () => {
  const previous = { promotions: [offer] },
    denied = { ...catalogRights(), enabled: false };
  assert.equal(catalogContentIssue(previous, previous, denied), '');
  assert.ok(
    catalogContentIssue({ promotions: [{ ...offer, recordedVideo: url }] }, previous, denied),
  );
  assert.equal(catalogContentIssue({ promotions: [] }, {}, denied), '');
});

test('editing preserves spaces and incomplete decimals while publication remains normalized', () => {
  const { normalizeCatalogue } = load(path.resolve('app/lib/catalogue.ts'));
  const item = {
    id: 'product',
    nameFr: 'Mug ',
    description: 'Une tasse ',
    price: '60,',
    oldPrice: '80.',
  };
  const edit = normalizeCatalogue([item], true)[0];
  assert.equal(edit.nameFr, 'Mug ');
  assert.equal(edit.description, 'Une tasse ');
  assert.equal(edit.price, '60,');
  assert.equal(edit.oldPrice, '80.');
  const published = normalizeCatalogue([{ ...item, price: '60,50', oldPrice: '80.00' }])[0];
  assert.equal(published.nameFr, 'Mug');
  assert.equal(published.price, '60.50');
  assert.equal(published.oldPrice, '80.00');
});
