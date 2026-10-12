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
