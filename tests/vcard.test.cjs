const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./ts-loader.cjs');
const { vcardText } = load(require('node:path').resolve('app/lib/vcard.ts'));
test('vCard exports French and Arabic names with CRLF contact fields', () => {
  const text = vcardText({ name: 'Élodie ليلى', phone: '0600000001', email: 'qa@example.test' });
  assert.match(text, /FN:Élodie ليلى\r\nTEL:0600000001\r\nEMAIL:qa@example.test/);
  assert(text.startsWith('BEGIN:VCARD\r\nVERSION:3.0'));
  assert(text.endsWith('END:VCARD'));
});
test('missing and null coordinates produce empty fields without throwing', () => {
  assert.match(
    vcardText({ name: 'Card', phone: null, email: undefined }),
    /TEL:\r\nEMAIL:\r\nEND:VCARD/,
  );
  assert.match(vcardText({ name: 'Card', phone: {}, email: 42 }), /TEL:\r\nEMAIL:\r\nEND:VCARD/);
});
test('contact text cannot inject additional vCard lines', () => {
  const text = vcardText({
    name: 'Name\r\nTEL:spoofed;',
    phone: '0600000001',
    email: 'qa@example.test',
  });
  assert.equal((text.match(/\r\nTEL:/g) || []).length, 1);
});

test('vCard exports organization, role, address and a safe website and folds long UTF-8 lines', () => {
  const text = vcardText({
    name: 'سورالينك '.repeat(30),
    business: 'SoraPrint',
    job: 'Gérant',
    address: '139 rue Marrakech, Oujda',
    website: 'https://soralink.link',
  });
  assert.match(
    text,
    /ORG:SoraPrint\r\nTITLE:Gérant\r\nADR:;;139 rue Marrakech  Oujda;;;;\r\nURL:https:\/\/soralink.link/,
  );
  for (const line of text.split('\r\n')) assert(Buffer.byteLength(line, 'utf8') <= 75);
  assert(text.replace(/\r\n /g, '').includes('FN:' + 'سورالينك '.repeat(30)));
  assert.doesNotMatch(vcardText({ website: 'javascript:alert(1)' }), /URL:/);
});
