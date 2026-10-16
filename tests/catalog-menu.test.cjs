const test = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('node:path');
const { load, req } = require('./ts-loader.cjs');
const menu = load(path.resolve('app/lib/catalog-menu.ts'));
const { publicCardData } = load(path.resolve('app/lib/public-card.ts'));
const { normalizeCatalogue, catalogueError } = load(path.resolve('app/lib/catalogue.ts'));
const { profileDataSchema } = load(path.resolve('app/lib/api-validation.ts'));
const { catalogOrderSchema, catalogOrderMessage } = load(path.resolve('app/lib/catalog-order.ts'));
const React = req('react'),
  { renderToStaticMarkup } = req('react-dom/server');
const Products = load(path.resolve('app/catalog-public.tsx')).default;
const url = '/api/upload?key=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const product = {
  id: 'one',
  name: 'Tasse',
  nameFr: 'Tasse',
  nameAr: 'كأس',
  description: 'Description française',
  descriptionAr: 'وصف عربي',
  price: '25.50',
  reference: 'REF-01',
  availability: 'available',
  image: url,
  images: [url],
  thumbnail: url,
};
const doc = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  src: url,
  titleFr: 'Menu',
  titleAr: 'القائمة',
  visible: true,
  allowDownload: true,
};
const rights = menu.catalogRights({ state: 'active' });
test('paid defaults remain forty products, three 25MB/100-page PDFs, with bounded admin overrides', () => {
  assert.equal(rights.maxProducts, 40);
  assert.equal(menu.catalogRights({ state: 'trial' }).maxProducts, 10);
  assert.equal(rights.pdfMB, 25);
  assert.equal(rights.pdfPages, 100);
  assert.equal(rights.maxDocuments, 3);
  assert.equal(menu.catalogRightsSchema.safeParse({ ...rights, maxProducts: 201 }).success, false);
  assert.equal(menu.catalogRightsSchema.safeParse({ ...rights, pdfPages: 101 }).success, false);
  assert.equal(
    menu.catalogRights({ catalog_rights: JSON.stringify({ ...rights, enabled: false }) }).enabled,
    false,
  );
});
test('legacy single PDF keeps a stable document identity while explicit empty array deletes it', () => {
  assert.equal(menu.catalogDocuments({ pdf: url })[0].id, 'legacy-pdf');
  assert.equal(menu.catalogDocuments({ pdf: url, catalogDocuments: [] }).length, 0);
  assert.equal(
    menu.documentContentPath('card', 'legacy-pdf'),
    '/api/catalog-documents/card/legacy-pdf',
  );
});
test('document metadata, duplicate IDs, categories, product images and prices are validated', () => {
  assert.equal(
    profileDataSchema.safeParse({ name: 'Card', catalogDocuments: [doc], services: [product] })
      .success,
    true,
  );
  for (const bad of [
    { ...product, images: Array(6).fill(url) },
    { ...product, promoStart: '2026-02-30' },
    { ...product, oldPrice: '-2' },
    { ...product, name: '', nameFr: '', nameAr: '', price: '20' },
    { ...product, availability: 'other' },
    { ...product, thumbnail: 'https://external.test/a.jpg' },
  ])
    assert.equal(profileDataSchema.safeParse({ name: 'Card', services: [bad] }).success, false);
  assert(menu.catalogContentIssue({ catalogDocuments: [doc, doc] }, {}, rights));
  assert(
    menu.catalogContentIssue({ services: [{ ...product, categoryId: 'missing' }] }, {}, rights),
  );
});
test('hidden products, hidden categories, PDF visibility and price settings are enforced by public projection', () => {
  const saved = {
    name: 'Card',
    services: [
      product,
      { ...product, id: 'hidden', availability: 'hidden' },
      { ...product, id: 'category-hidden', categoryId: 'private' },
    ],
    catalogCategories: [{ id: 'private', nameFr: 'Secret', visible: false }],
    catalogDocuments: [doc, { ...doc, id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', visible: false }],
    catalogSettings: { showPrices: false },
  };
  const out = publicCardData(saved, false, rights);
  assert.equal(out.services.length, 1);
  assert.equal(out.services[0].price, '');
  assert.equal(out.services[0].oldPrice, '');
  assert.equal(out.catalogDocuments.length, 1);
  assert.equal(out.catalogCategories.length, 0);
  assert.equal(out.pdf, '');
});
test('disabling module, PDF, products, downloads or WhatsApp survives direct public API projection', () => {
  const data = { name: 'Card', services: [product], catalogDocuments: [doc] };
  let out = publicCardData(data, false, { ...rights, enabled: false });
  assert.equal(out.services.length, 0);
  assert.equal(out.catalogDocuments.length, 0);
  out = publicCardData(data, false, { ...rights, pdf: false, products: false, whatsapp: false });
  assert.equal(out.catalogDocuments.length, 0);
  assert.equal(out.services.length, 0);
  assert.equal(out.catalogSettings.whatsapp, false);
  assert.equal(
    publicCardData(data, false, { ...rights, downloads: false }).catalogDocuments[0].allowDownload,
    false,
  );
});
test('disabled functions reject mutations while unchanged normalized legacy data permits unrelated card edits', () => {
  const original = { services: [{ id: 'old', name: 'Old' }] };
  const same = { services: normalizeCatalogue(original.services), bio: 'new bio' };
  assert.equal(menu.catalogContentIssue(same, original, { ...rights, enabled: false }), '');
  assert(
    menu.catalogContentIssue({ ...same, services: [product] }, original, {
      ...rights,
      enabled: false,
    }),
  );
  assert(menu.catalogContentIssue({ catalogDocuments: [doc] }, {}, { ...rights, pdf: false }));
});
test('lowered quota preserves saved content but prevents additions and caps public projection', () => {
  const old = { services: [product, { ...product, id: 'two' }] };
  const lower = { ...rights, maxProducts: 1 };
  assert.equal(menu.catalogContentIssue(old, old, lower), '');
  assert(
    menu.catalogContentIssue(
      { services: [...old.services, { ...product, id: 'three' }] },
      old,
      lower,
    ),
  );
  assert.equal(publicCardData(old, false, lower).services.length, 1);
});
test('missing translation uses a localized indication without copying the other language', () => {
  assert.equal(menu.catalogText('Only French', '', true), 'المحتوى غير متوفر بالعربية');
  assert.equal(menu.catalogText('', 'عربي', false), 'Contenu indisponible en français');
  assert.equal(menu.catalogText('', '', true, true), '');
  for (const ar of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(Products, {
        data: { services: [product] },
        id: 'card',
        ar,
        onRequest: () => {},
        onMessage: () => {},
      }),
    );
    assert.match(html, ar ? /كأس/ : /Tasse/);
    assert.doesNotMatch(html, ar ? /Tasse|Rechercher|Disponible/ : /كأس|البحث|متوفر/);
  }
});
test('WhatsApp message uses current authoritative names, references and quantities in only the chosen language', () => {
  const data = {
    services: [
      product,
      { ...product, id: 'two', nameFr: 'Mug', name: 'Mug', nameAr: 'كوب', reference: 'REF-02' },
    ],
  };
  const selection = [
    { id: 'one', quantity: 2 },
    { id: 'two', quantity: 1 },
  ];
  const fr = catalogOrderMessage(data, selection, false),
    ar = catalogOrderMessage(data, selection, true);
  assert.match(fr, /2 × Tasse/);
  assert.match(fr, /1 × Mug/);
  assert.match(fr, /REF-01/);
  assert.doesNotMatch(ar, /Tasse|Mug|Prix|DH/);
  assert.match(ar, /2 × كأس/);
  assert.throws(() =>
    catalogOrderMessage({ services: [{ ...product, availability: 'soldout' }] }, selection, false),
  );
  assert.equal(
    catalogOrderSchema.safeParse({
      profile: 'card',
      language: 'fr',
      items: [{ id: 'one', quantity: 0 }],
    }).success,
    false,
  );
  assert.equal(
    catalogOrderSchema.safeParse({
      profile: 'card',
      language: 'fr',
      items: [
        { id: 'one', quantity: 1 },
        { id: 'one', quantity: 2 },
      ],
    }).success,
    false,
  );
});

test('owner can add an empty product draft, type either language, and partially filled drafts require a name', () => {
  const draft = { id: 'new', name: '', description: '', image: '', price: '', images: [] };
  assert.equal(normalizeCatalogue([draft], true).length, 1);
  assert.equal(normalizeCatalogue([draft]).length, 0);
  const edited = normalizeCatalogue([draft], true).map((p) => ({ ...p, nameAr: 'كأس' }));
  assert.equal(normalizeCatalogue(edited)[0].nameAr, 'كأس');
  assert.equal(catalogueError(edited), null);
  assert(catalogueError([{ ...draft, images: [url] }]));
});

test('malformed stored administrator rights fail closed while a missing override uses the plan', () => {
  for (const raw of ['bad json', '{}', JSON.stringify({ ...rights, maxProducts: 9999 })]) {
    const effective = menu.catalogRights({ state: 'active', catalog_rights: raw });
    assert.equal(effective.enabled, false);
    assert.equal(effective.pdf, false);
    assert.equal(effective.products, false);
  }
  assert.equal(menu.catalogRights({ state: 'active', catalog_rights: null }).enabled, true);
});
