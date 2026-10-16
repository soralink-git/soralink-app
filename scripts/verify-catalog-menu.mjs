import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
export async function verifyCatalogMenu({ db, request, cardId, otherId, photo }) {
  const initial = await db.prepare('SELECT * FROM profiles WHERE id=?').bind(cardId).first();
  const base = {
    ...JSON.parse(initial.data),
    catalogDocuments: [],
    pdf: '',
    services: [],
    catalogCategories: [],
  };
  const docId = crypto.randomUUID(),
    catId = crypto.randomUUID();
  let data = base;
  async function save(next, options = {}) {
    const row = await db.prepare('SELECT updated FROM profiles WHERE id=?').bind(cardId).first();
    const result = await request('/api/data', {
      auth: true,
      data: {
        action: 'save',
        revision: row.updated,
        data: next,
        published: options.published ?? true,
      },
      ...options,
    });
    if (result.response.status === 200)
      data = JSON.parse((await request('/api/data', { auth: true })).json.profile.data);
    return result;
  }
  async function upload(content, type = 'application/pdf', options = {}) {
    const form = new FormData();
    form.set('file', new File([content], 'catalogue.pdf', { type }));
    form.set('purpose', type === 'application/pdf' ? 'catalog-pdf' : 'catalog-image');
    return request('/api/upload', { auth: true, method: 'POST', body: form, ...options });
  }
  const document = (src, id = docId) => ({
    id,
    src,
    titleFr: 'Menu français',
    titleAr: 'القائمة العربية',
    descriptionFr: 'Notre sélection',
    descriptionAr: 'الاختيار ديالنا',
    visible: true,
    allowDownload: false,
  });
  const product = (id = 'menu-one') => ({
    id,
    name: 'Tasse',
    nameFr: 'Tasse',
    nameAr: 'كأس',
    description: 'Description du produit',
    descriptionAr: 'وصف المنتج',
    price: '25',
    oldPrice: '30',
    reference: id === 'menu-one' ? 'REF-01' : 'REF-02',
    type: 'product',
    categoryId: catId,
    availability: 'available',
    image: base.avatar || '',
    images: base.avatar ? [base.avatar] : [],
    thumbnail: base.avatar || '',
  });
  const category = { id: catId, nameFr: 'Cadeaux', nameAr: 'هدايا', visible: true };
  await db
    .prepare("UPDATE profiles SET state='active',expires=?,catalog_rights=NULL WHERE id=?")
    .bind(new Date(Date.now() + 365 * 86400000).toISOString(), cardId)
    .run();
  try {
    await upload(photo, 'application/pdf', { status: 400 });
    const tooMany = await PDFDocument.create();
    for (let i = 0; i < 101; i++) tooMany.addPage();
    await upload(await tooMany.save(), 'application/pdf', { status: 400 });
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.addPage();
    pdf.addPage();
    const bytes = await pdf.save();
    const first = (await upload(bytes)).json.url;
    await save(
      {
        ...base,
        catalogDocuments: [document(first)],
        catalogCategories: [category],
        services: [product(), product('menu-two')],
      },
      { published: false },
    );
    const content = '/api/catalog-documents/' + cardId + '/' + docId;
    await request(content, { status: 404 });
    await request(first, { status: 404 });
    await request(content, { auth: true, id: otherId, status: 404 });
    await request(content, { auth: true });
    await request(content, { auth: true, headers: { Range: 'bytes=0-9' }, status: 206 });
    await request(content + '?download=1', { auth: true, status: 403 });
    await save(data);
    await request(content);
    await request(content, { headers: { Range: 'bytes=0-9' }, status: 206 });
    await request(content, { headers: { Range: 'bytes=999999-' }, status: 416 });
    let publicData = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(publicData.services.length, 2);
    assert.equal(publicData.catalogDocuments.length, 1);
    assert.equal(publicData.services[0].nameAr, 'كأس');
    const html = await request('/c/' + cardId);
    assert(html.text.includes('Lire le document'));
    assert(!html.text.includes('<iframe'));
    const order = {
      profile: cardId,
      language: 'fr',
      items: [
        { id: 'menu-one', quantity: 2 },
        { id: 'menu-two', quantity: 1 },
      ],
    };
    // Use a visible WhatsApp destination for the catalogue order action.
    await save({ ...data, whatsapp: '0661446664' });
    const orderFr = new URL(
      (await request('/api/catalog-order', { data: order })).json.url,
    ).searchParams.get('text');
    assert.match(orderFr, /2 × Tasse/);
    assert.match(orderFr, /REF-01/);
    const orderAr = new URL(
      (await request('/api/catalog-order', { data: { ...order, language: 'ar' } })).json.url,
    ).searchParams.get('text');
    assert.match(orderAr, /2 × كأس/);
    assert.doesNotMatch(orderAr, /Tasse|Prix|DH/);
    await request('/api/catalog-order', {
      data: { ...order, items: [{ id: 'menu-one', quantity: 0 }] },
      status: 400,
    });
    await request('/api/catalog-order', {
      data: order,
      headers: { Origin: 'https://other.test' },
      status: 403,
    });
    await save({
      ...data,
      services: data.services.map((p) => (p.id === 'menu-one' ? { ...p, price: '30.75' } : p)),
    });
    assert.equal(
      JSON.parse((await request('/api/data?id=' + cardId)).json.data).services[0].price,
      '30.75',
    );
    assert.match(
      new URL((await request('/api/catalog-order', { data: order })).json.url).searchParams.get(
        'text',
      ),
      /30,75/,
    );
    await save({ ...data, catalogSettings: { showPrices: false } });
    assert(
      !new URL((await request('/api/catalog-order', { data: order })).json.url).searchParams
        .get('text')
        .includes('30,75'),
    );
    await save({
      ...data,
      catalogSettings: { showPrices: true },
      services: data.services.map((p) =>
        p.id === 'menu-two' ? { ...p, availability: 'soldout' } : p,
      ),
    });
    await request('/api/catalog-order', { data: order, status: 409 });
    await save({
      ...data,
      services: data.services.map((p) =>
        p.id === 'menu-two' ? { ...p, availability: 'hidden' } : p,
      ),
    });
    assert.equal(
      JSON.parse((await request('/api/data?id=' + cardId)).json.data).services.length,
      1,
    );
    await save({ ...data, catalogCategories: [{ ...category, visible: false }] });
    assert.equal(
      JSON.parse((await request('/api/data?id=' + cardId)).json.data).services.length,
      0,
    );
    await save({
      ...data,
      catalogCategories: [category],
      catalogDocuments: [{ ...data.catalogDocuments[0], visible: false }],
    });
    await request(content, { status: 404 });
    await request(first, { status: 404 });
    await request(content, { auth: true });
    const secondPdf = await PDFDocument.create();
    secondPdf.addPage();
    const second = (await upload(await secondPdf.save())).json.url;
    await save({
      ...data,
      catalogDocuments: [
        { ...data.catalogDocuments[0], src: second, visible: true, allowDownload: true },
      ],
    });
    const replacement = await request(content);
    assert.equal(replacement.response.headers.get('content-type'), 'application/pdf');
    const download = await request(content + '?download=1');
    assert.match(download.response.headers.get('content-disposition'), /attachment/);
    await request(first, { auth: true, status: 404 });
    assert.equal(
      (
        await db
          .prepare('SELECT state FROM media_assets WHERE key=?')
          .bind(first.split('key=')[1])
          .first()
      ).state,
      'deleted',
    );
    // Neither a direct foreign asset reference nor an embedded string grants access.
    const foreign = (await upload(photo, 'image/png', { id: otherId })).json.url;
    await save({ ...data, services: [{ ...product(), image: foreign }] }, { status: 409 });
    await save({ ...data, bio: 'Lien de test ' + foreign });
    await request(foreign, { auth: true, status: 404 });
    await request(foreign, { status: 404 });
    await request('/api/catalog-documents/' + cardId + '/missing', {
      auth: true,
      id: otherId,
      status: 404,
    });
    const defaults = (await request('/api/data', { auth: true })).json.profile.catalogRights;
    async function setRights(rights, options = {}) {
      await request('/api/admin', {
        auth: true,
        id: options.id || undefined,
        data: { action: 'catalogRights', id: cardId, rights },
        ...options,
      });
    }
    await setRights({ ...defaults, enabled: false }, { status: 403 });
    const adminId = '33333333-3333-4333-8333-333333333333';
    async function adminRights(rights) {
      await setRights(rights, { id: adminId });
    }
    await adminRights({ ...defaults, downloads: false });
    await request(content + '?download=1', { status: 403 });
    await adminRights({ ...defaults, pdfPages: 1 });
    await upload(bytes, 'application/pdf', { status: 400 });
    await adminRights({ ...defaults, pdfMB: 1 });
    await upload(new Uint8Array(2 * 1024 * 1024), 'application/pdf', { status: 413 });
    await adminRights({ ...defaults, maxFiles: 1 });
    await upload(photo, 'image/png', { status: 413 });
    await adminRights({ ...defaults, pdf: false });
    await request(content, { status: 404 });
    await request(second, { status: 404 });
    await upload(bytes, 'application/pdf', { status: 403 });
    await adminRights({ ...defaults, whatsapp: false });
    await request('/api/catalog-order', {
      data: { ...order, items: [order.items[0]] },
      status: 403,
    });
    await adminRights({ ...defaults, products: false });
    assert.equal(
      JSON.parse((await request('/api/data?id=' + cardId)).json.data).services.length,
      0,
    );
    await save({ ...data, services: [{ ...product(), price: '99' }] }, { status: 403 });
    await upload(photo, 'image/png', { status: 403 });
    await adminRights({ ...defaults, enabled: false });
    await request(content, { status: 404 });
    await request('/api/catalog-order', { data: order, status: 403 });
    await save(
      { ...data, catalogRights: { ...defaults, enabled: true }, services: [product()] },
      { status: 403 },
    );
    await save({ ...data, bio: 'Mise à jour indépendante du catalogue' });
    await adminRights({ ...defaults, maxProducts: 1, maxDocuments: 0 });
    publicData = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(publicData.services.length, 1);
    assert.equal(publicData.catalogDocuments.length, 0);
    await save({ ...data, services: [...data.services, { ...product('third') }] }, { status: 400 });
    await adminRights(null);
    await db.prepare("UPDATE profiles SET state='suspended' WHERE id=?").bind(cardId).run();
    await request(content, { status: 404 });
    await request('/api/catalog-order', { data: order, status: 404 });
    console.log(
      'Catalogue / Menu verified: real PDF signatures/page limits, private/draft/hidden file isolation, ranges, replacement at stable URL and orphan deletion, bilingual products/categories, price changes, stock, server-generated multi-item WhatsApp message, CSRF, ownership including embedded references, admin feature controls, quotas and suspended accounts.',
    );
  } finally {
    await db
      .prepare(
        'UPDATE profiles SET data=?,state=?,expires=?,published=?,catalog_rights=? WHERE id=?',
      )
      .bind(
        initial.data,
        initial.state,
        initial.expires,
        initial.published,
        initial.catalog_rights,
        cardId,
      )
      .run();
  }
}
