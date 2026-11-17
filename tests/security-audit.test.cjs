const { test } = require('node:test');
const assert = require('node:assert/strict');
test('installed glob compilers reject repeated extglobs before regex compilation', async () => {
  const { verifyGlobMitigation } = await import('../scripts/security-audit.mjs');
  assert.equal(await verifyGlobMitigation(), 2);
});
test('only the specifically integrity-verified extglob advisory can be accounted for', async () => {
  const { blockingAdvisories } = await import('../scripts/security-audit.mjs');
  const known = {
    module_name: 'picomatch',
    url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
    findings: [{ version: '4.0.7' }],
  };
  assert.equal(blockingAdvisories({ advisories: { one: known } }).length, 0);
  for (const change of [
    { module_name: 'other' },
    { url: 'https://github.com/advisories/GHSA-other' },
    { findings: [{ version: '4.0.6' }] },
    { findings: [] },
  ])
    assert.equal(blockingAdvisories({ advisories: { one: { ...known, ...change } } }).length, 1);
});
