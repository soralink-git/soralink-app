const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { load } = require('./ts-loader.cjs');
const { active, trialExpiry } = load(path.resolve('app/lib/subscription.ts'));
test('trials expire without grace and paid subscriptions get exactly fifteen days', () => {
  const now = Date.parse('2026-10-15T12:00:00Z');
  const expires = new Date(now).toISOString();
  assert.equal(active({ state: 'trial', expires }, now), false);
  assert.equal(active({ state: 'trial', expires }, now - 1), true);
  assert.equal(active({ state: 'active', expires }, now + 15 * 86400000 - 1), true);
  assert.equal(active({ state: 'active', expires }, now + 15 * 86400000), false);
  for (const state of ['active', 'trial', 'suspended', 'unknown']) {
    assert.equal(active({ state, expires: null }, now), false);
    assert.equal(active({ state, expires: 'invalid' }, now), false);
  }
  assert.equal(active({ state: 'suspended', expires: trialExpiry(now) }, now), false);
  assert.equal(Date.parse(trialExpiry(now)) - now, 14 * 86400000);
});
