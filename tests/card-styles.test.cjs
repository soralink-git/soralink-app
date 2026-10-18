const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const { cardStyles, applyCardStyle, applyCardTheme, cardStyleId, socialOrder } = load(
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

function contrast(a, b) {
  const luminance = (hex) => {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
test('changing styles keeps the selected ambience, readable foregrounds and the existing cover through repeated light/dark switches', () => {
  const cover = '/api/upload?key=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  let data = { ...demoCard, cover };
  for (const theme of ['light', 'dark', 'light']) {
    data = applyCardTheme(data, theme);
    for (const style of cardStyles) {
      data = applyCardStyle(data, style.id);
      assert.equal(data.cardTheme, theme);
      assert.equal(data.cover, cover);
      assert(contrast(data.textColor, data.blockColor) >= 4.5);
      assert(contrast(data.textColor, data.fondColor) >= 4.5);
      for (const ar of [false, true]) {
        const html = renderToStaticMarkup(
          React.createElement(Card, {
            d: data,
            ar,
            withSections: true,
            setAr: () => {},
            onMessage: () => {},
            onRequest: () => {},
          }),
        );
        const banner = html.match(/<div class="card-cover"[^>]*>/)[0];
        assert(banner.includes(cover));
        assert(banner.includes('background-size:cover'));
        assert(banner.includes('background-position:center'));
        assert(banner.includes('background-repeat:no-repeat'));
      }
    }
  }
});
test('style miniatures follow the selected ambience and retain the selected custom palette', () => {
  const Picker = load(path.resolve('app/card-style-picker.tsx')).default;
  for (const theme of ['light', 'dark']) {
    const data = {
      ...applyCardTheme(applyCardStyle(demoCard, 'minimal'), theme),
      buttonColor: '#68459a',
    };
    const html = renderToStaticMarkup(
      React.createElement(Picker, { data, setData: () => {}, ar: false }),
    );
    const samples = html.match(/class="style-miniature[^>]+>/g);
    assert.equal(samples.length, 4);
    for (const sample of samples) {
      if (theme === 'dark') {
        assert(sample.includes('background:#10141d'));
        assert(sample.includes('color:#f8fafc'));
      } else assert(!sample.includes('color:#f8fafc'));
    }
    assert(
      samples
        .find((sample) => sample.includes('style-miniature-minimal'))
        .includes('--sample-accent:#68459a'),
    );
  }
});
