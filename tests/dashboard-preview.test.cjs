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
function context(tab) {
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
    ar: false,
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
    t: (fr) => fr,
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
        ar: false,
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
  'profile',
  'sections',
  'catalogue',
  'media',
  'promotions',
  'contacts',
  'requests',
  'schedule',
  'share',
  'orders',
])
  test(`one full-card preview remains in dashboard tab ${tab}`, () => {
    const html = renderToStaticMarkup(
      React.createElement(DashboardEditor, { context: context(tab) }),
    );
    assert.equal((html.match(/workspace-card-preview live-preview/g) || []).length, 1);
    assert.equal((html.match(/profile-card custom-card/g) || []).length, 1);
    assert.match(html, /workspace-tab-content/);
  });
