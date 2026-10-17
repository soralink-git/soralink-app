const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { cardStyles, applyCardStyle, cardStyleId, socialOrder } = load(
  path.resolve('app/lib/card-styles.ts'),
);
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const Card = load(path.resolve('app/card-view.tsx')).default;
const { demoCard } = load(path.resolve('app/lib/demo-card.ts'));
test('four presets preserve all content, privacy, publication and plan flags and pass save validation', () => {
  const original = {
    ...demoCard,
    name: 'Client',
    pro: false,
    hidePhone: true,
    hiddenSections: ['coordinates'],
    avatar: '/api/upload?key=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    catalogSettings: { enabled: false },
  };
  assert.equal(cardStyles.length, 4);
  for (const style of cardStyles) {
    const applied = applyCardStyle(original, style.id);
    for (const key of [
      'name',
      'pro',
      'hidePhone',
      'hiddenSections',
      'avatar',
      'catalogSettings',
      'services',
      'photos',
    ])
      assert.deepEqual(applied[key], original[key]);
    assert.equal(profileDataSchema.safeParse(applied).success, true);
    assert.equal(publicCardData(applied, false).phone, '');
    assert.equal(cardStyleId(style.id), style.id);
  }
  assert.equal(applyCardStyle(original, 'unknown'), original);
  assert.equal(cardStyleId('bad class injection'), '');
});
test('social ordering drops unknowns and duplicates, survives save/public projection and changes public link order', () => {
  const order = socialOrder(['linkedin', 'linkedin', 'private', 'instagram']);
  assert.equal(order.join(','), 'linkedin,instagram,facebook,tiktok,youtube,x');
  const saved = {
    ...demoCard,
    socialOrder: order,
    linkedin: 'https://www.linkedin.com/in/test',
    instagram: 'https://www.instagram.com/test',
    hideSocial: false,
  };
  assert.equal(profileDataSchema.safeParse(saved).success, true);
  assert.equal(
    profileDataSchema.safeParse({ ...saved, socialOrder: ['javascript'] }).success,
    false,
  );
  const out = publicCardData(saved, false);
  assert.equal(out.socialOrder.join(','), order.join(','));
  const html = renderToStaticMarkup(
    React.createElement(Card, {
      d: out,
      ar: false,
      setAr: () => {},
      onMessage: () => {},
      onRequest: () => {},
      withSections: true,
    }),
  );
  assert(html.indexOf('aria-label="LinkedIn"') < html.indexOf('aria-label="Instagram"'));
});
