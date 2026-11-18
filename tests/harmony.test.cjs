const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { load, req } = require('./ts-loader.cjs');
const { fieldFeedback } = load(path.resolve('app/lib/field-feedback.ts'));
const valid = { valid: true };

test('field feedback explains native constraints in French and Arabic without rejecting valid fields', () => {
  for (const ar of [false, true]) {
    assert.equal(fieldFeedback({ validity: valid }, ar), '');
    assert(fieldFeedback({ validity: valid }, ar, false).length > 10);
    for (const constraint of [
      'valueMissing',
      'typeMismatch',
      'tooShort',
      'tooLong',
      'patternMismatch',
      'rangeUnderflow',
      'rangeOverflow',
      'stepMismatch',
      'badInput',
    ]) {
      const message = fieldFeedback(
        { validity: { [constraint]: true }, type: 'email', minLength: 10, min: '1', max: '12' },
        ar,
      );
      assert(message.length > 10);
      assert(!message.includes('undefined'));
    }
    assert.match(
      fieldFeedback({ validity: { typeMismatch: true }, type: 'email' }, ar),
      /vous@exemple.ma/,
    );
    assert.match(fieldFeedback({ validity: { tooShort: true }, minLength: 10 }, ar), /10/);
  }
});

function luminance(hex) {
  const values = hex
    .match(/[a-f\d]{2}/gi)
    .map((c) => parseInt(c, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
test('platform foreground tokens exceed AAA text and AA input boundary contrast', () => {
  const css = fs.readFileSync('app/tokens.css', 'utf8');
  const [light, dark] = css.split("html[data-theme='dark']");
  const token = (source, name) => source.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1];
  const lightSurface = token(light, 'brand-white');
  for (const fg of ['brand-charcoal', 'muted', 'brand-strong'])
    assert(contrast(token(light, fg), lightSurface) >= 7, fg);
  const darkSurface = token(light, 'brand-slate');
  for (const fg of ['ink', 'muted']) assert(contrast(token(dark, fg), darkSurface) >= 7, fg);
  assert(contrast(token(light, 'brand-charcoal'), token(light, 'brand-orange')) >= 7);
  assert(contrast(token(light, 'brand-input-border'), lightSurface) >= 3);
  assert(contrast(token(dark, 'brand-input-border'), darkSurface) >= 3);
});

test('offer details are progressively disclosed while prices and ordering remain available', () => {
  const React = req('react');
  const { renderToStaticMarkup } = req('react-dom/server');
  const OfferGrid = load(path.resolve('app/offer-grid.tsx')).default;
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(OfferGrid, { ar, auth: false }));
    assert.equal((html.match(/<details class="offer-details"/g) || []).length, 3);
    assert.equal((html.match(/<summary>/g) || []).length, 3);
    assert.match(html, /249/);
    assert.match(html, /https:\/\/wa.me\/212661446664/);
  }
});
