import assert from 'node:assert/strict';

// Real built worker + isolated D1: plan checks must survive direct HTTP requests.
export async function verifyOffers({ db, request, cardId, adminId, otherId }) {
  const before = await db.prepare('SELECT * FROM profiles WHERE id=?').bind(cardId).first();
  const data = JSON.parse(before.data);
  const product = {
    id: 'plan-item',
    name: 'Test offre',
    nameFr: 'Test offre',
    nameAr: 'اختبار',
    price: '25',
    type: 'product',
    availability: 'available',
  };
  const fixture = {
    ...data,
    services: [product],
    profileLinks: undefined,
    whatsapp: '0661446664',
    hideWhatsApp: false,
    hiddenSections: [],
    catalogCategories: [],
    catalogSettings: { enabled: true, products: true, pdf: true, whatsapp: true },
  };
  const query = async () => (await request('/api/data', { auth: true })).json;
  const order = async (plan, kind = 'purchase') =>
    (await request('/api/data', { auth: true, data: { action: 'order', plan, kind } })).json;
  const admin = (body, status = 200) =>
    request('/api/admin', { auth: true, id: adminId, data: body, status });
  const latest = async () => (await query()).orders[0];
  try {
    await db
      .prepare(
        "UPDATE profiles SET plan='Identite', pro_enabled=1, state='active',data=? WHERE id=?",
      )
      .bind(JSON.stringify(fixture), cardId)
      .run();
    let owner = await query();
    assert.equal(owner.profile.catalogRights.enabled, false);
    assert.equal(owner.requests.length, 0);
    assert.equal(owner.contacts.length, 0);
    const basic = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(basic.pro, false);
    assert.equal(basic.activity, false);
    assert.equal(basic.services.length, 0);
    const html = (await request('/c/' + cardId)).text;
    assert(!html.includes('Échanger nos coordonnées'));
    assert(!html.includes('Demander un devis'));
    for (const history of ['contacts', 'requests'])
      await request('/api/data?history=' + history, { auth: true, status: 403 });
    await request('/api/data', {
      data: {
        action: 'request',
        profile: cardId,
        kind: 'contact',
        name: 'Test',
        phone: '0600000000',
        consent: true,
      },
      status: 403,
    });
    await request('/api/data', {
      auth: true,
      data: { action: 'deleteContact', id: 'nonexistent' },
      status: 403,
    });
    await request('/api/data', {
      auth: true,
      data: {
        action: 'save',
        revision: owner.profile.updated,
        data: { ...JSON.parse(owner.profile.data), services: [{ ...product, price: '30' }] },
        published: true,
      },
      status: 400,
    });
    await request('/api/data', {
      auth: true,
      data: { action: 'order', plan: 'Digital' },
      status: 400,
    });
    await request('/api/data', { auth: true, data: { action: 'order', plan: 'Nfc' }, status: 400 });

    // Selected pack must not activate until an administrator confirms payment.
    assert.equal((await order('Catalogue')).amount, 249);
    let purchase = await latest();
    assert.equal((await query()).profile.plan, 'Identite');
    await admin({ action: 'activateOrder', id: purchase.id }, 409);
    await request('/api/admin', {
      auth: true,
      data: { action: 'activateOrder', id: purchase.id },
      status: 403,
    });
    await admin({ action: 'order', id: purchase.id, status: 'paid' });
    await admin({ action: 'activateOrder', id: purchase.id });
    await admin({ action: 'activateOrder', id: purchase.id }, 409);
    owner = await query();
    assert.equal(owner.profile.plan, 'Catalogue');
    const catalogue = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(catalogue.services.length, 1);
    assert.equal(catalogue.activity, false);
    assert.equal(catalogue.pro, false);
    assert.equal(owner.profile.catalogRights.maxProducts, 40);
    const whatsapp = await request('/api/catalog-order', {
      data: { profile: cardId, language: 'fr', items: [{ id: product.id, quantity: 2 }] },
    });
    assert.equal(new URL(whatsapp.json.url).hostname, 'wa.me');
    assert(new URL(whatsapp.json.url).searchParams.get('text').includes('Test offre'));
    await request('/api/data?history=requests', { auth: true, status: 403 });

    // Renewal amount and retained tier come from server state, not the submitted plan.
    const expiry = owner.profile.expires;
    const renewal = await order('Identite', 'renewal');
    assert.equal(renewal.plan, 'Catalogue');
    assert.equal(renewal.amount, 149);
    const renewOrder = await latest();
    await admin({ action: 'order', id: renewOrder.id, status: 'paid' });
    const foreign = await request('/api/data', { auth: true, id: otherId });
    assert(!foreign.json.orders.some((o) => o.id === renewOrder.id));
    await admin({ action: 'activateOrder', id: renewOrder.id });
    await admin({ action: 'activateOrder', id: renewOrder.id }, 409);
    owner = await query();
    assert.equal(owner.profile.plan, 'Catalogue');
    assert.equal(
      new Date(owner.profile.expires).getUTCFullYear(),
      new Date(expiry).getUTCFullYear() + 1,
    );
    await admin({ action: 'activateOrder', id: renewOrder.id }, 409);

    assert.equal((await order('Activite')).amount, 499);
    purchase = await latest();
    await admin({ action: 'order', id: purchase.id, status: 'paid' });
    await admin({ action: 'activateOrder', id: purchase.id });
    await db.prepare('UPDATE profiles SET pro_enabled=0 WHERE id=?').bind(cardId).run();
    const activity = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(activity.pro, true);
    assert.equal(activity.activity, true);
    await request('/api/data?history=requests', { auth: true });
    assert.equal((await order('Identite', 'renewal')).amount, 149);
    const changedOrder = await latest();
    await admin({ action: 'order', id: changedOrder.id, status: 'paid' });
    await db.prepare("UPDATE profiles SET plan='Catalogue' WHERE id=?").bind(cardId).run();
    await admin({ action: 'activateOrder', id: changedOrder.id }, 409);
    assert.equal((await query()).profile.plan, 'Catalogue');
    console.log(
      'Offers verified: basic/catalogue/activity server rights, WhatsApp, manual payment activation, account isolation, 149 DH renewal with retained tier and idempotent activation.',
    );
  } finally {
    await db
      .prepare(
        'UPDATE profiles SET data=?,plan=?,state=?,expires=?,pro_enabled=?,updated=? WHERE id=?',
      )
      .bind(
        before.data,
        before.plan,
        before.state,
        before.expires,
        before.pro_enabled,
        before.updated,
        cardId,
      )
      .run();
  }
}
