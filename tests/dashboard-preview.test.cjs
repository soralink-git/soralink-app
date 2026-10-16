const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const DashboardEditor = load(path.resolve('app/dashboard-editor.tsx')).default,
  CardView = load(path.resolve('app/card-view.tsx')).default;
const { demoCard } = load(path.resolve('app/lib/demo-card.ts')),
  { defaults } = load(path.resolve('app/lib/schedule.ts'));
const { sectionKeys } = load(path.resolve('app/lib/personalization.ts'));
const noop = () => {};
function context(tab, ar = false) {
  const data = {
    ...defaults,
    ...demoCard,
    avatar: '',
    cover: '',
    pdf: '',
    video: '',
    recordedVideo: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
    x: '',
    sectionOrder: sectionKeys,
    hiddenSections: [],
    sectionTitles: { fr: {}, ar: {} },
  };
  return {
    tab,
    data,
    ar,
    auth: true,
    loaded: true,
    busy: false,
    id: 'public-card',
    inbox: [],
    orders: [],
    contacts: [],
    notifications: [],
    promoToday: '2026-10-12',
    promoStatusLabels: { active: ['Visible', 'باين'] },
    socialFields: [],
    sectionLabels: Object.fromEntries(sectionKeys.map((k) => [k, [k, k]])),
    photoCaptureRef: { current: null },
    videoCaptureRef: { current: null },
    t: (fr, da) => (ar ? da : fr),
    field: (key, label) =>
      React.createElement(
        'label',
        { className: 'field' },
        label,
        React.createElement('input', { value: data[key] || '', readOnly: true }),
      ),
    Customization: () => null,
    Card: (props) =>
      React.createElement(CardView, {
        ...props,
        ar,
        view: 'app',
        id: 'public-card',
        setAr: noop,
        onMessage: noop,
        onRequest: noop,
      }),
    setTab: noop,
    setData: noop,
    setMsg: noop,
    setModal: noop,
    setPublished: noop,
    setServiceIndex: noop,
    save: noop,
    load: noop,
    logout: noop,
    action: async () => {},
    upload: noop,
    uploadPhotos: noop,
    uploadVideo: noop,
    uploadCatalogue: noop,
    uploadPromotion: noop,
    updateCatalogue: noop,
    updatePromotion: noop,
    startCrop: noop,
  };
}
for (const tab of [
  'coordinates',
  'content',
  'interface',
  'contacts',
  'requests',
  'schedule',
  'share',
  'orders',
  'profile',
  'sections',
  'catalogue',
  'media',
  'promotions',
])
  test(`one full-card preview remains in dashboard tab ${tab}`, () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardEditor, { context: context(tab) }),
    );
    assert.equal((html.match(/workspace-card-preview/g) || []).length, 1);
    assert.equal((html.match(/profile-card card-design custom-card/g) || []).length, 1);
    assert.match(html, /workspace-tab-content/);
  });

test('logo and cover controls are rendered in the Interface tab', () => {
  const html = renderToStaticMarkup(
    React.createElement(DashboardEditor, { context: context('interface') }),
  );
  assert.match(html, /Portrait \/ logo/);
  assert.match(html, /Image de couverture/);
  assert.match(html, /Portrait, logo et couverture/);
});

for (const ar of [false, true])
  test(`workspace groups and selected section render in ${ar ? 'Arabic' : 'French'}`, () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardEditor, { context: context('contacts', ar) }),
    );
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 7);
    assert.match(html, ar ? /<h1>الكونطاكت ديالي<\/h1>/ : /<h1>Mes contacts<\/h1>/);
    assert.match(html, ar ? /خصّص الكارط/ : /Personnaliser/);
    assert.match(html, ar ? /الزبناء ديالي/ : /Mes clients/);
    assert.equal((html.match(/workspace-card-preview/g) || []).length, 1);
  });

for (const ar of [false, true])
  test(`preview and public card render exactly the same card markup in ${ar ? 'Arabic' : 'French'}`, () => {
    const ctx = context('profile', ar);
    const PublicCardView = load(path.resolve('app/public-card-view.tsx')).default;
    const previewHtml = renderToStaticMarkup(
      React.createElement(DashboardEditor, { context: ctx }),
    );
    const publicHtml = renderToStaticMarkup(
      React.createElement(PublicCardView, {
        initialData: ctx.data,
        initialAr: ar,
        cardId: 'public-card',
      }),
    );
    const article = (html) => html.match(/<article\b[\s\S]*?<\/article>/)[0];
    assert.equal(article(previewHtml), article(publicHtml));
    assert.doesNotMatch(article(previewHtml), /compact/);
    assert.doesNotMatch(article(previewHtml), /card-language/);
  });

test('media controls live in the catalogue media tab rather than in a separate dashboard panel', () => {
  const ctx = context('content');
  const html = renderToStaticMarkup(React.createElement(DashboardEditor, { context: ctx }));
  assert.match(html, /id="catalog-tab-media"/);
  assert.doesNotMatch(html, /Galerie photos &amp; Documents intégrés/);
  const Editor = load(path.resolve('app/catalog-editor.tsx')).default;
  const Media = load(path.resolve('app/catalog-media-editor.tsx')).default;
  for (const ar of [false, true]) {
    const c = context('media', ar);
    const panel = renderToStaticMarkup(
      React.createElement(Editor, {
        data: c.data,
        setData: noop,
        ar,
        busy: false,
        save: noop,
        onMessage: noop,
        initialTab: 'media',
        mediaEditor: React.createElement(Media, { context: c }),
      }),
    );
    assert.match(panel, /id="catalog-panel-media"/);
    assert.match(panel, ar ? /صوّر فيديو/ : /Filmer une vidéo/);
    assert.match(panel, ar ? /خد تصويرة/ : /Prendre une photo/);
    assert.match(panel, /capture="environment"/);
    assert.match(panel, ar ? /إظهار الصور فالكاتالوگ/ : /Afficher les photos dans le catalogue/);
    assert.doesNotMatch(panel, ar ? /Prendre une photo|Filmer une vidéo/ : /خد تصويرة|صوّر فيديو/);
  }
});
test('photo and video section controls are grouped into the catalogue rather than ordered separately', () => {
  const ctx = context('interface');
  const html = renderToStaticMarkup(React.createElement(DashboardEditor, { context: ctx }));
  assert.doesNotMatch(html, /aria-label="Position de photos"|aria-label="Position de video"/);
  assert.match(html, /aria-label="Position de services"/);
});

test('catalogue opens on products with a clear first action and isolates offers from the initial form', () => {
  for (const ar of [false, true]) {
    const c = context('content', ar);
    c.data = { ...c.data, services: [] };
    const html = renderToStaticMarkup(React.createElement(DashboardEditor, { context: c }));
    assert.match(html, /id="catalog-panel-products"/);
    assert.match(html, ar ? /إضافة منتج أو خدمة/ : /Ajouter un produit ou service/);
    assert.match(html, /id="catalog-tab-promotions"/);
    // Promotions and PDF inputs do not crowd the initial product workflow.
    assert.doesNotMatch(html, /class="promotion-editor"|accept="application\/pdf"/);
    assert.match(html, ar ? /بدا بالاسم/ : /Commencez par un nom/);
    const offers = renderToStaticMarkup(
      React.createElement(DashboardEditor, { context: context('promotions', ar) }),
    );
    assert.match(offers, /id="catalog-panel-promotions"/);
    assert.match(offers, /class="promotion-editor"/);
    assert.doesNotMatch(offers, /id="catalog-panel-products"/);
  }
});

test('product editing exposes one content language and keeps advanced controls collapsed', () => {
  const Editor = load(path.resolve('app/catalog-editor.tsx')).default;
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(Editor, {
        data: { services: [{ id: 'draft', name: '', nameFr: '', nameAr: '' }] },
        setData: noop,
        ar,
        busy: false,
        save: noop,
        onMessage: noop,
      }),
    );
    assert.match(html, /class="catalogue-editor" open=""/);
    assert.match(
      html,
      new RegExp('lang="' + (ar ? 'ar' : 'fr') + '" dir="' + (ar ? 'rtl' : 'ltr') + '"'),
    );
    assert.doesNotMatch(html, new RegExp('lang="' + (ar ? 'fr' : 'ar') + '"'));
    assert.match(html, /<details class="catalog-options">/);
    assert.doesNotMatch(html, /<details class="catalog-options" open/);
    assert.match(html, ar ? /حفظ التغييرات/ : /Enregistrer les modifications/);
  }
});
