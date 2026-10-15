const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { signupPath, workspacePath, selectedPlan } = load(path.resolve('app/lib/journey-links.ts'));
test('chosen offers and language survive authentication and unknown plans cannot redirect outside the app', () => {
  assert.equal(signupPath(true, 'Pack'), '/auth?mode=signup&lang=ar&offer=Pack');
  assert.equal(signupPath(true, 'Pack', true), '/?app=1&lang=ar&offer=Pack&tab=orders');
  assert.equal(selectedPlan('https://outside.test'), undefined);
  assert.equal(workspacePath(false, 'https://outside.test'), '/?app=1');
});
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const Auth = load(path.resolve('app/auth/ui.tsx')).default;
const LegalView = load(path.resolve('app/legal-view.tsx')).default;
test('Arabic auth shows chosen offer in Arabic and removes the unavailable historical sign-in link', () => {
  const html = renderToStaticMarkup(
    React.createElement(Auth, { initialArabic: true, initialOffer: 'Accompagnement' }),
  );
  assert.match(html, /خدمة كاملة/);
  assert.doesNotMatch(html, /signin-with-chatgpt|Offre choisie|Clé en main/);
});
test('legal view renders exactly the selected language', () => {
  for (const ar of [true, false]) {
    const html = renderToStaticMarkup(
      React.createElement(LegalView, {
        initialArabic: ar,
        french: React.createElement('h1', null, 'Confidentialité'),
        arabic: React.createElement('h1', null, 'الخصوصية'),
      }),
    );
    assert.match(html, ar ? /<h1>الخصوصية<\/h1>/ : /<h1>Confidentialité<\/h1>/);
    assert.doesNotMatch(html, ar ? /<h1>Confidentialité<\/h1>/ : /<h1>الخصوصية<\/h1>/);
  }
});

test('administrator connection screen follows its initial language', () => {
  const Admin = load(path.resolve('app/admin/ui.tsx')).default;
  const html = renderToStaticMarkup(React.createElement(Admin, { initialArabic: true }));
  assert.match(html, /دخول الإدارة/);
  assert.doesNotMatch(html, /Connexion administrateur|Mon espace/);
});
