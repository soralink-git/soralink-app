const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const { appearance, normalizeAppearance } = load(path.resolve('app/lib/personalization.ts'));
const { cropSettings, cropRect } = load(path.resolve('app/lib/crop-geometry.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const BackgroundEditor = load(path.resolve('app/background-editor.tsx')).default;
const CardView = load(path.resolve('app/card-view.tsx')).default;
const photo = '/api/upload?key=12345678-1234-1234-1234-123456789abc';
test('background opacity preserves zero, defaults for old cards and is bounded', () => {
  assert.equal(appearance({}).backgroundOpacity, 35);
  for (const opacity of [0, 35, 100])
    assert.equal(
      normalizeAppearance({ backgroundPhoto: photo, backgroundOpacity: opacity }).backgroundOpacity,
      opacity,
    );
  assert.equal(appearance({ backgroundOpacity: -1 }).backgroundOpacity, 0);
  assert.equal(appearance({ backgroundOpacity: 101 }).backgroundOpacity, 100);
  assert.equal(appearance({ backgroundOpacity: NaN }).backgroundOpacity, 35);
});
test('saved backgrounds require internal uploaded images and valid numeric opacity', () => {
  assert.equal(
    profileDataSchema.safeParse({ name: 'Test', backgroundPhoto: photo, backgroundOpacity: 0 })
      .success,
    true,
  );
  for (const backgroundPhoto of [
    'https://external.test/photo.jpg',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
  ])
    assert.equal(profileDataSchema.safeParse({ name: 'Test', backgroundPhoto }).success, false);
  for (const backgroundOpacity of [-1, 101, '50'])
    assert.equal(profileDataSchema.safeParse({ name: 'Test', backgroundOpacity }).success, false);
  assert.equal(
    publicCardData({ name: 'Test', backgroundPhoto: photo, backgroundOpacity: 48 }, false)
      .backgroundPhoto,
    photo,
  );
  assert.equal(publicCardData({ name: 'Test', backgroundOpacity: 0 }, false).backgroundOpacity, 0);
});
test('portrait background cropping has bounded output and stays within the source', () => {
  const settings = cropSettings('backgroundPhoto');
  assert.equal(settings.ratio, 3 / 4);
  assert.equal(settings.maxWidth, 1600);
  assert.equal(cropSettings('avatar').ratio, 1);
  assert.equal(cropSettings('cover').ratio, 2.2);
  const rect = cropRect(2400, 1600, settings.ratio, 2, 1, -1);
  assert.equal(rect.sw / rect.sh, 3 / 4);
  assert(rect.sx >= 0 && rect.sy >= 0 && rect.sx + rect.sw <= 2400 && rect.sy + rect.sh <= 1600);
});
test('only the image layer receives opacity and the public card keeps usable actions', () => {
  const html = renderToStaticMarkup(
    React.createElement(CardView, {
      d: { name: 'Test', backgroundPhoto: photo, backgroundOpacity: 48 },
      ar: false,
      setAr() {},
      onMessage() {},
      onRequest() {},
      withSections: true,
    }),
  );
  assert.match(html, /has-photo-background/);
  assert.match(html, /class="card-background-photo"[^>]*style="opacity:0.48"/);
  assert.doesNotMatch(html, /<article[^>]*opacity:/);
  assert.match(html, /Enregistrer le contact/);
});
test('background editor uses the chosen language and includes recrop, removal and opacity', () => {
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(BackgroundEditor, {
        data: { backgroundPhoto: photo, backgroundOpacity: 0 },
        setData() {},
        startCrop() {},
        busy: false,
        ar,
      }),
    );
    assert.match(html, /type="range"/);
    assert.match(html, /value="0"/);
    assert.match(html, ar ? /قصّ الخلفية/ : /Recadrer le fond/);
    assert.doesNotMatch(html, ar ? /Photo de fond|Retirer la photo/ : /تصويرة|الوضوح/);
  }
});
