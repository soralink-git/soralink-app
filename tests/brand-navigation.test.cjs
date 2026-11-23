const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const SiteHeader = load(path.resolve('app/site-header.tsx')).default;
const Auth = load(path.resolve('app/auth/ui.tsx')).default;

for (const ar of [false, true]) {
  test(`compact navigation retains named login, language and signup actions (${ar ? 'ar' : 'fr'})`, () => {
    const html = renderToStaticMarkup(
      React.createElement(SiteHeader, {
        ar,
        view: 'home',
        t: (fr, da) => (ar ? da : fr),
        toggleLanguage() {},
        sessionChecked: true,
        auth: false,
        loaded: true,
        authLoading: false,
        canAdmin: false,
        accountEmail: '',
        busy: false,
        async logout() {},
      }),
    );
    assert.match(
      html,
      ar ? /aria-label="الدخول للحساب ديالي"/ : /aria-label="Se connecter à mon espace"/,
    );
    assert.match(html, ar ? /aria-label="Passer en français"/ : /aria-label="التبديل إلى العربية"/);
    assert.match(
      html,
      ar ? /href="\/auth\?mode=signup&amp;lang=ar"/ : /href="\/auth\?mode=signup"/,
    );
    for (const anchor of ['fonctionnalites', 'exemples', 'tarifs', 'faq'])
      assert(html.includes('#' + anchor));
  });
  test(`marketing and authentication share the same home link and symbol (${ar ? 'ar' : 'fr'})`, () => {
    const auth = renderToStaticMarkup(React.createElement(Auth, { initialArabic: ar }));
    assert.match(auth, ar ? /aria-label="SoraLink — الرئيسية"/ : /aria-label="SoraLink — Accueil"/);
    assert.match(auth, ar ? /href="\/\?lang=ar"/ : /href="\/\?lang=fr"/);
    assert.match(auth, /viewBox="0 0 64 64"[^>]*aria-hidden="true"/);
    assert.doesNotMatch(auth, /lucide-nfc/);
    assert.match(auth, /type="email"/);
    assert.match(auth, /type="password"/);
  });
}
