const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');

test('single action: metadata and validation covers all 13 types', () => {
  const { singleActionTypes, isSingleActionValid, formatSingleActionHref, resolveSingleAction } =
    load(path.resolve('app/lib/single-action.ts'));

  assert.equal(singleActionTypes.length, 13);

  // 1. Google review
  assert.equal(isSingleActionValid('google_review', 'https://g.page/r/example/review'), true);
  assert.equal(isSingleActionValid('google_review', 'not-a-url'), false);

  // 2. WhatsApp
  assert.equal(isSingleActionValid('whatsapp', '+212612345678'), true);
  assert.equal(isSingleActionValid('whatsapp', '0612345678'), true);
  assert.equal(isSingleActionValid('whatsapp', 'abc'), false);

  // 3. Call
  assert.equal(isSingleActionValid('call', '+212522001122'), true);
  assert.equal(isSingleActionValid('call', '0522001122'), true);
  assert.equal(isSingleActionValid('call', 'bad-phone'), false);

  // 4. Website
  assert.equal(isSingleActionValid('website', 'https://example.com'), true);
  assert.equal(isSingleActionValid('website', 'http://example.com'), true);
  assert.equal(isSingleActionValid('website', 'javascript:alert(1)'), false);

  // 5. Socials
  assert.equal(isSingleActionValid('facebook', 'https://facebook.com/myshop'), true);
  assert.equal(isSingleActionValid('instagram', '@myshop'), true);
  assert.equal(isSingleActionValid('tiktok', '@coolbrand'), true);
  assert.equal(isSingleActionValid('linkedin', 'https://linkedin.com/company/cool'), true);
  assert.equal(isSingleActionValid('youtube', 'https://youtube.com/@channel'), true);

  // 6. Maps, booking, menu, custom
  assert.equal(isSingleActionValid('maps', 'https://maps.google.com/?q=Casablanca'), true);
  assert.equal(isSingleActionValid('booking', 'https://calendly.com/meeting'), true);
  assert.equal(isSingleActionValid('menu', 'https://drive.google.com/file/d/menu.pdf'), true);
  assert.equal(isSingleActionValid('custom', 'https://soralink.link/special'), true);
  assert.equal(isSingleActionValid('custom', 'data:text/html,bad'), false);

  // Href formatting
  assert.equal(formatSingleActionHref('call', '+212612345678'), 'tel:+212612345678');
  assert.equal(
    formatSingleActionHref('whatsapp', '+212612345678', 'Bonjour'),
    'https://wa.me/212612345678?text=Bonjour',
  );
  assert.equal(formatSingleActionHref('website', 'example.com'), 'https://example.com');
  assert.equal(formatSingleActionHref('instagram', '@soralink'), 'https://instagram.com/soralink');
});

test('single action: resolveSingleAction falls back gracefully and localizes labels', () => {
  const { resolveSingleAction } = load(path.resolve('app/lib/single-action.ts'));

  // Disabled or missing
  assert.equal(resolveSingleAction(null, false), null);
  assert.equal(resolveSingleAction({}, false), null);
  assert.equal(resolveSingleAction({ singleAction: { enabled: false } }, false), null);

  // Enabled review in French
  const frReview = resolveSingleAction(
    {
      singleAction: {
        enabled: true,
        type: 'google_review',
        value: 'https://g.page/r/example/review',
      },
    },
    false,
  );
  assert.ok(frReview);
  assert.equal(frReview.type, 'google_review');
  assert.equal(frReview.href, 'https://g.page/r/example/review');
  assert.equal(frReview.label, 'Laissez-nous un avis Google');

  // Enabled review in Arabic
  const arReview = resolveSingleAction(
    {
      singleAction: {
        enabled: true,
        type: 'google_review',
        value: 'https://g.page/r/example/review',
      },
    },
    true,
  );
  assert.ok(arReview);
  assert.equal(arReview.label, 'اترك لنا تقييماً على Google');

  // Custom label overrides
  const custom = resolveSingleAction(
    {
      singleAction: {
        enabled: true,
        type: 'custom',
        value: 'https://soralink.link/promo',
        labelFr: 'Profitez de la promo',
        labelAr: 'استفد من العرض',
      },
    },
    true,
  );
  assert.ok(custom);
  assert.equal(custom.label, 'استفد من العرض');
  assert.equal(custom.href, 'https://soralink.link/promo');
});

test('single action: publicCardData retains sanitized singleAction configuration', () => {
  const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));

  const card = publicCardData(
    {
      name: 'Test Business',
      singleAction: {
        enabled: true,
        type: 'whatsapp',
        value: '+212612345678',
        whatsappMessage: 'Salam',
        customLabelFr: 'Contactez-nous',
      },
    },
    false,
    'full',
    {},
  );

  assert.ok(card.singleAction);
  assert.equal(card.singleAction.enabled, true);
  assert.equal(card.singleAction.type, 'whatsapp');
  assert.equal(card.singleAction.value, '+212612345678');
  assert.equal(card.singleAction.message, 'Salam');
});
