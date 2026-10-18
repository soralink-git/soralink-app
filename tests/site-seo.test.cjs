const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { homeMetadata, websiteStructuredData } = load(path.resolve('app/lib/site-seo.ts'));

test('public landing canonical strips tracking and offer parameters and links both languages', () => {
  const metadata = homeMetadata({ lang: 'fr', offer: 'pack', utm_source: 'test' });
  assert.equal(metadata.alternates.canonical, 'https://soralink.link/');
  assert.equal(metadata.alternates.languages.ar, 'https://soralink.link/?lang=ar');
  assert.equal(metadata.robots.index, true);
  assert.match(metadata.title, /NFC au Maroc/);
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.openGraph.locale, 'fr_MA');
});
test('Arabic landing has its own canonical and localized search and share descriptions', () => {
  const metadata = homeMetadata({ lang: 'ar' });
  assert.equal(metadata.alternates.canonical, 'https://soralink.link/?lang=ar');
  assert.equal(metadata.openGraph.locale, 'ar_MA');
  assert.match(metadata.description, /المغرب/);
  assert.doesNotMatch(metadata.description, /Créez|coordonnées|rendez-vous/);
  assert.equal(metadata.twitter.title, metadata.title);
  assert.equal(metadata.alternates.languages.fr, 'https://soralink.link/');
});
test('every workspace query form stays non-indexable without a public canonical', () => {
  for (const params of [{ app: '' }, { app: '1', lang: 'ar' }, { tab: 'links' }, { tab: '' }]) {
    const metadata = homeMetadata(params);
    assert.equal(metadata.robots.index, false);
    assert.equal(metadata.robots.follow, false);
    assert.equal(metadata.alternates, undefined);
  }
});
test('structured site identity contains only platform facts and no fabricated reviews or customer URLs', () => {
  assert.equal(websiteStructuredData['@graph'][0].name, 'SoraLink');
  assert.equal(websiteStructuredData['@graph'][0].url, 'https://soralink.link/');
  assert.doesNotMatch(
    JSON.stringify(websiteStructuredData),
    /aggregateRating|review|\/c\/|SearchAction/,
  );
});
