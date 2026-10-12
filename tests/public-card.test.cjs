const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const { demoCard, demoCardArabic } = load(path.resolve('app/lib/demo-card.ts'));
const PublicCardView = load(path.resolve('app/public-card-view.tsx')).default;
const CardView = load(path.resolve('app/card-view.tsx')).default;
const PublicRequestModal = load(path.resolve('app/public-request-modal.tsx')).default;
function render(Component, props) {
  return renderToStaticMarkup(React.createElement(Component, props));
}
function card(data, extra = {}) {
  return render(CardView, {
    d: data,
    ar: false,
    setAr: () => {},
    id: 'public-card',
    onMessage: () => {},
    onRequest: () => {},
    withSections: true,
    ...extra,
  });
}
test('public card is present in server HTML without workspace or legal footer', () => {
  const html = render(PublicCardView, { cardId: 'public-card', initialData: demoCard });
  assert.match(html, /SoraLink/);
  assert.match(html, /unified-card/);
  assert.match(html, /card-language/);
  assert.match(html, /Partager cette carte/);
  assert.match(html, /Échanger nos coordonnées/);
  assert.doesNotMatch(html, /workspace-editor-layout|ImageCropper|site-footer|<header/);
});
test('Arabic stays Arabic while the SoraLink brand stays left to right', () => {
  const html = render(PublicCardView, {
    initialData: demoCard,
    demoArabic: demoCardArabic,
    initialAr: true,
  });
  assert.match(html, /dir="rtl"/);
  assert.match(html, /class="card-brand" dir="ltr"/);
  assert.match(html, /مثال SoraLink/);
  assert.doesNotMatch(html, /Partager cette carte/);
});
test('hidden sections and coordinates do not leak into rendered card actions', () => {
  const html = card({
    ...demoCard,
    hiddenSections: ['services', 'appointments'],
    hidePhone: true,
    hideEmail: true,
    hideWhatsApp: true,
    hideSocial: true,
    hideLocation: true,
  });
  assert.doesNotMatch(
    html,
    /href="tel:|href="mailto:|href="https:\/\/wa.me|catalogue-item|Demander un rendez-vous/,
  );
  assert.match(html, /Partager cette carte/);
});
test('empty content produces no catalogue panels', () => {
  assert.doesNotMatch(
    card({ ...demoCard, services: [], photos: [], promotions: [], pro: false }),
    /catalogue-item|card-promotions|class="gallery"/,
  );
});
test('shared renderer preserves theme, sizing, color and shape customization', () => {
  const html = card({
    ...demoCard,
    cardTheme: 'sand',
    textSize: 'large',
    buttonSize: 'large',
    buttonStyle: 'outline',
    textColor: '#123456',
    buttonColor: '#654321',
    buttonShape: 'pill',
  });
  assert.match(html, /theme-sand text-size-large button-size-large button-style-outline/);
  assert.match(html, /--card-fg:#123456/);
  assert.match(html, /--accent:#654321/);
  assert.match(html, /--button-radius:30px/);
});
test('contact exchange still requires explicit consent', () => {
  const html = render(PublicRequestModal, {
    kind: 'contact',
    id: 'public-card',
    data: demoCard,
    selectedItem: null,
    ar: false,
    onClose: () => {},
    onMessage: () => {},
  });
  assert.match(
    html.match(/<input\b[^>]*>/g).find((tag) => tag.includes('name="consent"')),
    /required/,
  );
  assert.match(
    html.match(/<input\b[^>]*>/g).find((tag) => tag.includes('name="phone"')),
    /required/,
  );
  assert.match(html, /name="email"/);
});
test('order dialog retains selected catalogue information', () => {
  const html = render(PublicRequestModal, {
    kind: 'commande',
    id: 'public-card',
    data: demoCard,
    selectedItem: demoCard.services[1],
    ar: false,
    onClose: () => {},
    onMessage: () => {},
  });
  assert.match(html, /Cadeau personnalisé/);
  assert.match(html, /Votre demande de commande/);
});
test('booking cannot be submitted without an available slot', () => {
  const html = render(PublicRequestModal, {
    kind: 'rdv',
    id: 'public-card',
    data: demoCard,
    selectedItem: null,
    ar: false,
    onClose: () => {},
    onMessage: () => {},
  });
  assert.match(html, /name="slot"[^>]*required[^>]*disabled/);
  assert.match(html, /Jour souhaité/);
  assert.doesNotMatch(html, /datetime-local/);
});

test('primary card actions precede content and remain unique', () => {
  const html = card(demoCard);
  const actionStart = html.indexOf('class="card-actions"');
  assert.ok(actionStart > html.indexOf('class="card-identity"'));
  assert.ok(actionStart < html.indexOf('class="public-details'));
  for (const label of [
    'Enregistrer le contact',
    'Partager cette carte',
    'Échanger nos coordonnées',
  ]) {
    assert.equal(html.split(label).length - 1, 1, label);
  }
  assert.match(html, /class="card-button card-save"/);
});
