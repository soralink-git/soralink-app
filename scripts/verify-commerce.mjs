import assert from 'node:assert/strict';
export async function verifyCommerce({ db, request, cardId, adminId, otherId, photo }) {
  const initial = await db.prepare('SELECT * FROM profiles WHERE id=?').bind(cardId).first();
  const priorRequests = new Set(
    (await db.prepare('SELECT id FROM requests WHERE profile=?').bind(cardId).all()).results.map(
      (r) => r.id,
    ),
  );
  const orderId = crypto.randomUUID();
  const data = {
    ...JSON.parse(initial.data),
    profileLinks: undefined,
    whatsapp: '0661446664',
    hideWhatsApp: false,
    hiddenSections: [],
    services: [
      {
        id: 'commerce-one',
        type: 'product',
        nameFr: 'Produit test',
        nameAr: 'منتج تجريبي',
        price: '20',
        reference: 'QA-01',
        availability: 'available',
        variants: [
          { id: 'large', nameFr: 'Grand', nameAr: 'كبير', price: '40', availability: 'available' },
          { id: 'sold', nameFr: 'Épuisé', nameAr: 'نفد', price: '50', availability: 'soldout' },
        ],
      },
    ],
    catalogSettings: {
      enabled: true,
      products: true,
      pdf: true,
      whatsapp: true,
      showPrices: true,
      fulfillmentModes: ['takeaway', 'delivery'],
    },
  };
  const post = (body, options = {}) =>
    request('/api/catalog-order', {
      data: body,
      headers: { 'CF-Connecting-IP': '192.0.2.44' },
      ...options,
    });
  const body = {
    profile: cardId,
    intentId: crypto.randomUUID(),
    language: 'fr',
    fulfillment: 'takeaway',
    items: [{ id: 'commerce-one', variantId: 'large', quantity: 2 }],
  };
  try {
    await db
      .prepare(
        "UPDATE profiles SET plan='Activite',state='active',expires=?,data=?,published=1,catalog_rights=NULL,client_access=NULL WHERE id=?",
      )
      .bind(new Date(Date.now() + 86400000).toISOString(), JSON.stringify(data), cardId)
      .run();
    const first = await post(body);
    assert.match(new URL(first.json.url).searchParams.get('text'), /Grand.*40 DH/);
    await post(body);
    const records = await db
      .prepare(
        'SELECT * FROM requests WHERE id IN (SELECT request_id FROM catalog_order_intents WHERE id=?)',
      )
      .bind(body.intentId)
      .all();
    assert.equal(records.results.length, 1);
    assert.match(records.results[0].service, /envoi à confirmer/);
    await post(
      { ...body, items: [{ id: 'commerce-one', variantId: 'large', quantity: 3 }] },
      { status: 409 },
    );
    await post(
      {
        ...body,
        intentId: crypto.randomUUID(),
        items: [{ id: 'commerce-one', variantId: 'sold', quantity: 1 }],
      },
      { status: 409 },
    );
    await post(
      { ...body, intentId: crypto.randomUUID(), fulfillment: 'delivery', address: '' },
      { status: 409 },
    );
    const delivery = await post({
      ...body,
      intentId: crypto.randomUUID(),
      language: 'ar',
      fulfillment: 'delivery',
      address: 'عنوان تجريبي',
    });
    const message = new URL(delivery.json.url).searchParams.get('text');
    assert.match(message, /كبير/);
    assert.match(message, /عنوان تجريبي/);
    assert.doesNotMatch(message, /Grand|Prix|DH/);
    await request('/api/data', {
      data: {
        action: 'request',
        profile: cardId,
        kind: 'commande',
        language: 'fr',
        name: 'Client test',
        phone: '0612345678',
        message: 'Demande test',
        catalogueId: 'commerce-one',
        variantId: 'large',
      },
    });
    const variantRequest = await db
      .prepare(
        "SELECT message FROM requests WHERE profile=? AND name='Client test' ORDER BY created DESC LIMIT 1",
      )
      .bind(cardId)
      .first();
    assert.match(variantRequest.message, /Grand/);
    assert.match(variantRequest.message, /40 DH/);
    for (const source of ['qr', 'qr', 'nfc'])
      await request('/api/metrics', {
        method: 'POST',
        data: { profile: cardId, source },
        status: 204,
        headers: { 'CF-Connecting-IP': '192.0.2.45', 'User-Agent': 'SoraLink QA' },
      });
    await request('/api/metrics', {
      data: { profile: cardId, source: 'direct' },
      status: 204,
      headers: { 'User-Agent': 'Googlebot' },
    });
    await request('/api/metrics', {
      auth: true,
      data: { profile: cardId, source: 'direct' },
      status: 204,
    });
    const metrics = (await request('/api/metrics', { auth: true })).json;
    assert.equal(
      metrics.rows.reduce((n, r) => n + r.visits, 0),
      2,
    );
    await request('/api/metrics?profile=' + cardId, {
      auth: true,
      id: otherId,
      status: 403,
    });
    await db.prepare("UPDATE profiles SET plan='Identite' WHERE id=?").bind(cardId).run();
    await request('/api/metrics', { auth: true, status: 403 });
    await db
      .prepare("UPDATE profiles SET plan='Activite',expires='2020-01-01' WHERE id=?")
      .bind(cardId)
      .run();
    await db
      .prepare(
        "INSERT INTO orders(id,owner,plan,kind,amount,status,created) VALUES(?,?,'Activite','renewal',149,'pending',?)",
      )
      .bind(orderId, initial.owner, new Date().toISOString())
      .run();
    const upload = (options = {}) => {
      const form = new FormData();
      form.set('order', orderId);
      form.set('file', new File([photo], 'justificatif.png', { type: 'image/png' }));
      return request('/api/payment-receipts', {
        auth: true,
        method: 'POST',
        body: form,
        ...options,
      });
    };
    const proof = (await upload()).json.id;
    await upload({ id: otherId, status: 409 });
    await request('/api/payment-receipts?order=' + orderId, {
      auth: true,
      id: otherId,
      status: 404,
    });
    await request('/api/payment-receipts/' + proof, { status: 401 });
    await request('/api/payment-receipts/' + proof, { auth: true, id: otherId, status: 404 });
    const ownerFile = await request('/api/payment-receipts/' + proof, { auth: true });
    assert.match(ownerFile.response.headers.get('cache-control'), /no-store/);
    assert.match(ownerFile.response.headers.get('content-type'), /image\/png/);
    await request('/api/payment-receipts/' + proof, { auth: true, id: adminId });
    assert.equal(
      (await db.prepare('SELECT status,applied FROM orders WHERE id=?').bind(orderId).first())
        .status,
      'pending',
    );
    await db.prepare("UPDATE orders SET status='paid' WHERE id=?").bind(orderId).run();
    await upload({ status: 409 });
    console.log(
      'Commerce verified: idempotent prepared WhatsApp inquiries, validated variants/delivery, isolated private receipts for expired renewals, owner/admin-only access and QR/NFC source deduplication. No payment auto-activation or outbound message.',
    );
  } finally {
    const created = (
      await db.prepare('SELECT id FROM requests WHERE profile=?').bind(cardId).all()
    ).results.filter((r) => !priorRequests.has(r.id));
    for (const row of created)
      await db.prepare('DELETE FROM requests WHERE id=?').bind(row.id).run();
    await db.prepare('DELETE FROM catalog_order_intents WHERE profile=?').bind(cardId).run();
    await db.prepare('DELETE FROM profile_metrics WHERE profile=?').bind(cardId).run();
    await db.prepare('DELETE FROM profile_metric_seen WHERE profile=?').bind(cardId).run();
    await db.prepare('DELETE FROM payment_receipts WHERE order_id=?').bind(orderId).run();
    await db.prepare('DELETE FROM orders WHERE id=?').bind(orderId).run();
    await db
      .prepare(
        'UPDATE profiles SET data=?,plan=?,state=?,expires=?,published=?,client_access=?,catalog_rights=? WHERE id=?',
      )
      .bind(
        initial.data,
        initial.plan,
        initial.state,
        initial.expires,
        initial.published,
        initial.client_access,
        initial.catalog_rights,
        cardId,
      )
      .run();
  }
}
