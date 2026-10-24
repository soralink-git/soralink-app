import assert from 'node:assert/strict';
export async function verifyPrimaryColor({ db, request, cardId }) {
  const original = await db.prepare('SELECT * FROM profiles WHERE id=?').bind(cardId).first();
  const own = (await request('/api/data', { auth: true })).json;
  const data = { ...JSON.parse(original.data), color: '#12abef', buttonColor: '#12abef' };
  try {
    const saved = await request('/api/data', {
      auth: true,
      data: {
        action: 'save',
        data,
        published: true,
        revision: original.updated,
        expectedOwner: own.saveOwner,
      },
    });
    const visible = JSON.parse((await request('/api/data?id=' + cardId)).json.data);
    assert.equal(visible.color, '#12abef');
    assert.equal(visible.buttonColor, '#12abef');
    const html = (await request('/c/' + cardId)).text;
    assert(html.includes('--button-bg:#12abef'));
    await request('/api/data', {
      auth: true,
      status: 403,
      data: {
        action: 'save',
        data: { ...data, textSize: data.textSize === 'extra' ? 'normal' : 'extra' },
        published: true,
        revision: saved.json.revision,
        expectedOwner: own.saveOwner,
      },
    });
    assert.equal(
      (await request('/api/data', { auth: true })).json.profile.updated,
      saved.json.revision,
    );
    console.log(
      'Primary color verified: custom accent saves and renders publicly while advanced settings remain protected.',
    );
  } finally {
    await db
      .prepare('UPDATE profiles SET data=?,published=?,updated=? WHERE id=?')
      .bind(original.data, original.published, original.updated, cardId)
      .run();
  }
}
