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
