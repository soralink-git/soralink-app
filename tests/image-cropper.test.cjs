const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const Cropper = load(path.resolve('app/image-cropper.tsx')).default;
const { demoCard } = load(path.resolve('app/lib/demo-card.ts'));
function render(target, ar, cardData) {
  return renderToStaticMarkup(
    React.createElement(Cropper, {
      source: '/icons/icon-512.png',
      target,
      ar,
      circle: true,
      cardData,
      onCancel() {},
      onApply: async () => {},
    }),
  );
}
test('logo and cover adjustment preview uses the real card, its theme and sections in both directions', () => {
  for (const target of ['avatar', 'cover', 'backgroundPhoto']) {
    for (const ar of [false, true]) {
      for (const cardTheme of ['light', 'dark']) {
        const html = render(target, ar, {
          ...demoCard,
          name: 'Crop Preview',
          cardTheme,
          avatar: '/avatar.webp',
          cover: '/cover.webp',
          template: 'minimal',
        });
        assert.match(html, /role="dialog" aria-modal="true"/);
        assert(html.includes(`dir="${ar ? 'rtl' : 'ltr'}"`));
        assert.match(html, /inert="" class="crop-real-card"/);
        assert(html.includes('theme-' + cardTheme));
        assert.match(html, /unified-card/);
        assert.match(html, /Crop Preview/);
        assert.match(html, /src="\/avatar.webp"/);
        assert.match(html, /background-image:url\(\/cover.webp\)/);
        assert.match(html, /public-details/);
        assert(html.indexOf('crop-workspace') < html.indexOf('crop-footer'));
        assert(html.includes(ar ? 'طبّق القصّ' : 'Appliquer le recadrage'));
        assert(!html.includes(ar ? 'Appliquer le recadrage' : 'طبّق القصّ'));
      }
    }
  }
});
test('product cropping remains available without card data and does not promise card autosave', () => {
  for (const ar of [false, true]) {
    const html = render('product', ar);
    assert(!html.includes('crop-real-card'));
    assert.match(html, /<canvas/);
    assert.equal((html.match(/type="range"/g) || []).length, 3);
    assert(
      html.includes(
        ar ? 'طبّق القصّ باش ترفع التصويرة.' : 'Appliquez le cadrage pour importer la photo.',
      ),
    );
    assert(!html.includes('automatiquement'));
  }
});
