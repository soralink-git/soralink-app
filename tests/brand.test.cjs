const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { BRAND } = load(path.resolve('app/lib/brand.ts'));
const css = fs.readFileSync('app/tokens.css', 'utf8');
function tokens(dark) {
  const root = css.match(/:root\s*\{([^}]+)\}/)[1];
  const override = css.match(/html\[data-theme='dark'\]\s*\{([^}]+)\}/)[1];
  const values = Object.fromEntries(
    [...(root + (dark ? override : '')).matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2].trim(),
    ]),
  );
  return (key) => {
    let value = values[key];
    for (let i = 0; value.startsWith('var(') && i < 10; i++) value = values[value.slice(4, -1)];
    assert.match(value, /^#[0-9a-f]{6}$/);
    return value;
  };
}
function luminance(hex) {
  return [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test('platform palette meets text and input-boundary contrast in light and dark modes', () => {
  for (const dark of [false, true]) {
    const color = tokens(dark);
    for (const bg of [
      '--brand-canvas',
      '--brand-surface',
      '--brand-soft',
      '--brand-field',
      '--brand-tint',
    ]) {
      for (const fg of ['--ink', '--muted', '--brand-strong']) {
        assert(contrast(color(fg), color(bg)) >= 4.5, `${dark ? 'dark' : 'light'} ${fg} on ${bg}`);
      }
    }
    for (const bg of ['--brand-accent', '--brand-accent-hover']) {
      assert(contrast(color('--brand-on-accent'), color(bg)) >= 4.5);
    }
    assert(contrast(color('--brand-input-border'), color('--brand-field')) >= 3);
  }
});
test('identity palette, localized app shells and generated icon dimensions stay consistent', () => {
  const color = tokens(false);
  for (const [key, value] of Object.entries(BRAND)) assert.equal(color('--brand-' + key), value);
  const { appManifest } = load(path.resolve('app/lib/pwa-manifest.ts'));
  for (const ar of [false, true]) {
    assert.equal(appManifest(ar).theme_color, BRAND.charcoal);
    assert.equal(appManifest(ar).background_color, BRAND.charcoal);
  }
  for (const [name, width] of [
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['maskable-512.png', 512],
    ['apple-touch-icon.png', 180],
  ]) {
    const png = fs.readFileSync('public/icons/' + name);
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), width);
  }
  const og = fs.readFileSync('public/og-soralink.png');
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
});
