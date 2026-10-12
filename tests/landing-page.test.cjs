const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const LandingPage = load(path.resolve('app/landing-page.tsx')).default;
const CardView = load(path.resolve('app/card-view.tsx')).default;
const { demoCard } = load(path.resolve('app/lib/demo-card.ts'));
function render(ar, auth = false) {
  const Card = (props) =>
    React.createElement(CardView, {
      ...props,
      ar,
      setAr: () => {},
      view: 'home',
      onMessage: () => {},
      onRequest: () => {},
    });
  return renderToStaticMarkup(
    React.createElement(LandingPage, { ar, auth, Card, blank: demoCard, onPricing: () => {} }),
  );
}
test('entire French landing renders after lazy loading with all six readable feature blocks', () => {
  const html = render(false);
  assert.match(html, /Toute votre activité/);
  assert.match(html, /Rendez-vous avec l’option Pro/);
  assert.equal((html.match(/class="feature-index"/g) || []).length, 6);
  assert.match(html, /class="feature-index">06<\/span>/);
  assert.match(html, /href="\/auth\?mode=signup"/);
});
test('entire Darija landing renders after lazy loading without French appointment heading', () => {
  const html = render(true);
  assert.match(html, /المواعيد مع Pro/);
  assert.doesNotMatch(html, /Rendez-vous avec l’option Pro/);
  assert.equal((html.match(/class="feature-index"/g) || []).length, 6);
  assert.match(html, /href="\/auth\?mode=signup&amp;lang=ar"/);
});
test('connected visitor landing links the main call to action to the workspace', () => {
  assert.match(render(false, true), /class="primary" href="\/\?app=1"/);
});
