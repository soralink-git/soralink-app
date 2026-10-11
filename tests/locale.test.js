import test from 'node:test';
import assert from 'node:assert/strict';
import {PLAN_LABELS,MODE_LABELS,STATUS_LABELS,localized,errorText,localError} from '../src/locale.js';
import {PLANS,SPECIAL} from '../src/domain.js';
test('Every plan, card mode and status has French and Arabic labels',()=>{
 for(const [table,keys] of [[PLAN_LABELS,Object.keys(PLANS)],[MODE_LABELS,['profile',...Object.keys(SPECIAL)]],[STATUS_LABELS,['draft','published','suspended']]]) {
  for(const key of keys){assert.ok(table[key]?.[0]);assert.match(table[key][1],/[\u0600-\u06ff]/);assert.notEqual(localized(table,key,'fr'),key);}
 }
});
test('Raw provider errors never become visible English messages',()=>{
 const raw={message:'Invalid login credentials',code:'invalid_credentials'};
 assert.match(errorText(raw,'fr'),/incorrect/);
 assert.match(errorText(raw,'ar'),/[\u0600-\u06ff]/);
 assert.doesNotMatch(errorText({message:'Internal database failure'},'fr'),/Internal database failure/);
 assert.doesNotMatch(errorText({message:'Internal database failure'},'ar'),/Internal database failure/);
 assert.equal(errorText(localError('Utilisez un lien sécurisé.'),'fr'),'Utilisez un lien sécurisé.');
});
