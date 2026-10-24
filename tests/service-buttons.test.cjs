const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { serviceButtonStyle, serviceColors } = load(path.resolve('app/lib/service-buttons.ts'));
const { clientDesignAllowed } = load(path.resolve('app/lib/card-design.ts'));
const { clientEditIssue } = load(path.resolve('app/lib/client-access.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const Links = load(path.resolve('app/profile-links-view.tsx')).default;
const Card = load(path.resolve('app/card-view.tsx')).default;
const data = { name: 'Amine', color: '#12abef', buttonColor: '#12abef' };
test('dedicated network backgrounds use the card color for generic or unknown services', () => {
  for (const kind of [
    'phone',
    'email',
    'address',
    'website',
    'googleReview',
    'unknown',
    '__proto__',
    'toString',
  ])
    assert.equal(serviceButtonStyle(data, kind)['--service-bg'], '#12abef');
  for (const [kind, color] of Object.entries(serviceColors)) {
    assert.equal(serviceButtonStyle(data, kind)['--service-bg'], color);
    assert.equal(
      serviceButtonStyle({ ...data, serviceButtonMode: 'card' }, kind)['--service-bg'],
      '#12abef',
    );
  }
});
function luminance(hex) {
  return [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
test('icons retain at least 4.5:1 contrast on brand backgrounds and arbitrary card grays', () => {
  for (const bg of [
    ...Object.values(serviceColors),
    ...Array.from({ length: 256 }, (_, i) => '#' + i.toString(16).padStart(2, '0').repeat(3)),
  ]) {
    const style = serviceButtonStyle({ buttonColor: bg, serviceButtonMode: 'card' }, 'phone');
    const a = luminance(style['--service-bg']),
      b = luminance(style['--service-fg']);
    assert((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5, bg);
  }
});
test('color mode is validated and public, while hidden editors and advanced settings stay protected', () => {
  const next = { ...data, serviceButtonMode: 'card' };
  assert(profileDataSchema.safeParse(next).success);
  assert(!profileDataSchema.safeParse({ ...next, serviceButtonMode: 'arbitrary-css' }).success);
  assert.equal(publicCardData(next, false).serviceButtonMode, 'card');
  assert.equal(publicCardData(data, false).serviceButtonMode, 'official');
  assert(clientDesignAllowed(next, data));
  assert(!clientDesignAllowed({ ...next, textSize: 'extra' }, data));
  assert(
    clientEditIssue(
      { plan: 'Identite', client_access: { sections: { interface: false } } },
      next,
      data,
      false,
    ),
  );
});
for (const ar of [false, true])
  test(`contact links show icons only with distinct accessible labels (${ar ? 'ar' : 'fr'})`, () => {
    const profileLinks = [
      ['p1', 'phone', '0600000001'],
      ['p2', 'phone', '0600000002'],
      ['wa', 'whatsapp', '+212600000001'],
      ['mail', 'email', 'contact@example.test'],
      ['addr', 'address', 'Oujda'],
    ].map(([id, kind, value]) => ({ id, kind, value, visible: true, labelFr: '', labelAr: '' }));
    const html = renderToStaticMarkup(
      React.createElement(Links, {
        data: { ...data, profileLinks },
        group: 'coordinates',
        ar,
        onMessage() {},
      }),
    );
    const anchors = [...html.matchAll(/<a([^>]*)>([\s\S]*?)<\/a>/g)];
    assert.equal(anchors.length, 5);
    for (const [, attrs, inner] of anchors) {
      assert.match(attrs, /aria-label=/);
      assert.match(inner, /<svg/);
      assert.equal(inner.replace(/<[^>]*>/g, '').trim(), '');
    }
    const phones = anchors.filter(([, attrs]) => attrs.includes('href="tel:'));
    assert.notEqual(
      phones[0][1].match(/aria-label="([^"]+)"/)[1],
      phones[1][1].match(/aria-label="([^"]+)"/)[1],
    );
    assert.doesNotMatch(html, /<strong|<small|class="email-actions"/);
  });
test('legacy contact and social buttons follow the same backgrounds and omit address captions', () => {
  const html = renderToStaticMarkup(
    React.createElement(Card, {
      d: publicCardData(
        {
          ...data,
          phone: '0600000001',
          whatsapp: '0660000001',
          address: 'Oujda',
          facebook: 'https://facebook.com/example',
        },
        false,
      ),
      ar: false,
      withSections: true,
      setAr() {},
      onMessage() {},
      onRequest() {},
    }),
  );
  assert.match(html, /--service-bg:#25d366/);
  assert.match(html, /--service-bg:#0866ff/);
  assert.match(html, /--service-bg:#12abef/);
  assert.doesNotMatch(html, /class="contact-label"|class="location-links"/);
});
