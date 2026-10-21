import assert from 'node:assert/strict';
export async function verifyClientAccess({ db, request, cardId, adminId }) {
  const before = await db.prepare('SELECT * FROM profiles WHERE id=?').bind(cardId).first();
  const date = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const getOwner = async () => (await request('/api/data', { auth: true })).json;
  const getAdminProfile = async () =>
    (await request('/api/admin', { auth: true, id: adminId })).json.profiles.find(
      (p) => p.id === cardId,
    );
  const update = async (access, { plan = 'Activite', revision, status = 200 } = {}) => {
    const profile = await getAdminProfile();
    return request('/api/admin', {
      auth: true,
      id: adminId,
      data: {
        action: 'profile',
        id: cardId,
        state: 'active',
        plan,
        expires: date,
        clientAccess: access,
        expectedSettings: revision ?? profile.managementRevision,
      },
      status,
    });
  };
  const save = async (changes, status = 200) => {
    const owner = await getOwner();
    return request('/api/data', {
      auth: true,
      data: {
        action: 'save',
        revision: owner.profile.updated,
        data: { ...JSON.parse(owner.profile.data), ...changes },
        published: true,
      },
      status,
    });
  };
  try {
    const product = {
      id: 'access-item',
      name: 'Offre visible',
      type: 'product',
      availability: 'available',
      price: '20',
    };
    await db
      .prepare("UPDATE profiles SET data=?,state='active',expires=?,client_access=NULL WHERE id=?")
      .bind(
        JSON.stringify({
          ...JSON.parse(before.data),
          services: [product],
          catalogDocuments: [],
          pdf: '',
          catalogCategories: [],
          catalogSettings: { enabled: true, pdf: true, products: true, whatsapp: true },
        }),
        new Date(date + 'T23:59:59Z').toISOString(),
        cardId,
      )
      .run();
    const access = {
      modules: {},
      sections: { content: false, contacts: false, requests: false, schedule: false, share: false },
    };
    const original = await getAdminProfile();
    await request('/api/admin', {
      auth: true,
      data: {
        action: 'profile',
        id: cardId,
        state: 'active',
        plan: 'Activite',
        expires: date,
        clientAccess: access,
      },
      status: 403,
    });
    await update(access, { revision: 'stale', status: 409 });
    await update({ sections: { invented: true } }, { status: 400 });
    await update(access);
    await update(access, { revision: original.managementRevision, status: 409 });
    let owner = await getOwner();
    assert.equal(JSON.parse(owner.profile.client_access).sections.content, false);
    assert.equal(owner.requests.length, 0);
    for (const kind of ['requests', 'contacts'])
      await request('/api/data?history=' + kind, { auth: true, status: 403 });
    await request('/api/address', { auth: true, data: { name: 'access-hidden' }, status: 403 });
    await request('/api/data', {
      auth: true,
      data: { action: 'deleteContact', id: 'not-found' },
      status: 403,
    });
    let card = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(card.services.length, 1, 'Hiding the editor keeps published content');
    assert.equal(card.pro, true, 'Hiding the agenda editor keeps public booking');
    await save({ services: [{ ...product, price: '30' }] }, 403);
    await save({ hours: {} }, 403);
    await save({ bio: 'Identity remains editable' });
    card = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(card.bio, 'Identity remains editable');
    assert.equal(card.services[0].price, '20');

    // Functional switches act on all server routes and the public card.
    await update({ modules: { catalogue: false, activity: false }, sections: {} });
    owner = await getOwner();
    assert.equal(owner.profile.catalogRights.enabled, false);
    card = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(card.services.length, 0);
    assert.equal(card.pro, false);
    assert.equal(card.activity, false);
    await request('/api/availability?id=' + cardId + '&date=' + date, { status: 404 });
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
    await request('/api/catalog-order', {
      data: { profile: cardId, language: 'fr', items: [{ id: product.id, quantity: 1 }] },
      status: 403,
    });
    await save({ bio: 'Still editable with modules disabled' });
    // A client cannot grant itself permissions through profile JSON.
    await save({ client_access: { modules: { catalogue: true, activity: true } } });
    card = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(card.activity, false);
    assert.equal((await getOwner()).profile.catalogRights.enabled, false);

    // A renewal leaves administrative exceptions intact and restores do not lose legacy Pro.
    await update(
      { modules: { appointments: false }, sections: { requests: false } },
      { plan: 'Digital' },
    );
    await db.prepare('UPDATE profiles SET pro_enabled=1 WHERE id=?').bind(cardId).run();
    await request('/api/data', {
      auth: true,
      data: { action: 'order', plan: 'Digital', kind: 'renewal' },
    });
    const renewal = (await getOwner()).orders.find(
      (o) => o.kind === 'renewal' && o.status === 'pending' && !o.applied && o.plan === 'Digital',
    );
    await request('/api/admin', {
      auth: true,
      id: adminId,
      data: { action: 'order', id: renewal.id, status: 'paid' },
    });
    await request('/api/admin', {
      auth: true,
      id: adminId,
      data: { action: 'activateOrder', id: renewal.id },
    });
    owner = await getOwner();
    assert.equal(owner.profile.pro_enabled, 1);
    assert.equal(JSON.parse(owner.profile.client_access).modules.appointments, false);
    assert.equal(JSON.parse((await request('/api/data?id=' + cardId)).json.data).pro, false);
    await update(null, { plan: 'Digital' });
    // Legacy checkbox is explicit during the subscription update.
    await db.prepare('UPDATE profiles SET pro_enabled=1 WHERE id=?').bind(cardId).run();
    assert.equal(JSON.parse((await request('/api/data?id=' + cardId)).json.data).pro, true);
    assert.equal((await getOwner()).profile.catalogRights.enabled, true);
    await request('/api/data?history=requests', { auth: true });
    console.log(
      'Client administration verified: owner isolation, strict settings, conflict protection, hidden editors and actions, separate public visibility, module enforcement, forged-right refusal, preserved renewal exceptions and reset.',
    );
  } finally {
    await db
      .prepare(
        'UPDATE profiles SET data=?,plan=?,state=?,expires=?,pro_enabled=?,updated=?,client_access=? WHERE id=?',
      )
      .bind(
        before.data,
        before.plan,
        before.state,
        before.expires,
        before.pro_enabled,
        before.updated,
        before.client_access,
        cardId,
      )
      .run();
  }
}
