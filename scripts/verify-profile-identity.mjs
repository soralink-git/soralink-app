import assert from 'node:assert/strict';
export async function verifyProfileIdentity({ db, request, cardId, adminId }) {
  const original = await db.prepare('SELECT * FROM profiles WHERE id=?').bind(cardId).first();
  const own = (await request('/api/data', { auth: true })).json;
  const data = {
    ...JSON.parse(original.data),
    profileType: 'business',
    business: 'Atelier Atlas',
    name: '',
  };
  try {
    const result = await request('/api/data', {
      auth: true,
      data: {
        action: 'save',
        data,
        published: true,
        revision: original.updated,
        expectedOwner: own.saveOwner,
      },
    });
    const saved = (await request('/api/data', { auth: true })).json.profile;
    const stored = JSON.parse(saved.data);
    assert.equal(stored.name, '');
    assert.equal(stored.business, 'Atelier Atlas');
    assert.equal(stored.profileType, 'business');
    const visible = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(visible.profileType, 'business');
    const matching = (
      await request('/api/admin?section=profiles&search=Atelier%20Atlas', {
        auth: true,
        id: adminId,
      })
    ).json.profiles;
    assert(matching.some((profile) => profile.id === cardId));
    for (const lang of ['fr', 'ar']) {
      const html = (await request('/c/' + cardId + '?lang=' + lang)).text;
      assert.match(html, /<h2>Atelier Atlas<\/h2>/);
    }
    for (const invalid of [
      { ...stored, business: ' ', name: 'Amine' },
      { ...stored, profileType: 'person' },
    ])
      await request('/api/data', {
        auth: true,
        status: 400,
        data: {
          action: 'save',
          data: invalid,
          published: true,
          revision: result.json.revision,
          expectedOwner: own.saveOwner,
        },
      });
    const unchanged = (await request('/api/data', { auth: true })).json.profile;
    assert.equal(unchanged.updated, saved.updated);
    console.log(
      'Profile identity verified: establishment-only save, public FR/AR heading, selected-name validation and unchanged legacy defaults.',
    );
  } finally {
    await db
      .prepare('UPDATE profiles SET data=?,published=?,updated=? WHERE id=?')
      .bind(original.data, original.published, original.updated, cardId)
      .run();
  }
}
