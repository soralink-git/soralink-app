import test from 'node:test';
import assert from 'node:assert/strict';
import {pagePath} from '../src/routing.js';
test('Pages clean URLs resolve to the correct app page', () => {
 for (const page of ['dashboard','admin','reset','demo','privacy']) {
  assert.equal(pagePath('/'+page), '/'+page+'.html');
  assert.equal(pagePath('/'+page+'/'), '/'+page+'.html');
  assert.equal(pagePath('/'+page+'.html'), '/'+page+'.html');
 }
 assert.equal(pagePath('/c/644477c4-9140-4327-ae96-5eeac5528b11'), '/c/644477c4-9140-4327-ae96-5eeac5528b11');
 assert.equal(pagePath('/'), '/');
});
