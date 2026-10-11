import test from 'node:test';
import assert from 'node:assert/strict';
import {renderWorkspace,renderAdmin} from '../src/workspace-ui.js';
const id='11111111-1111-4111-8111-111111111111';
test('Workspace escapes profile values and separates interface languages',()=>{
 const card={id,name:'<img onerror=alert(1)>',title:'Métier',bio:'Présentation',name_ar:'الاسم',title_ar:'النشاط',bio_ar:'التقديم'};
 const rights={plan:'social',status:'draft',modules:['identity','social_links','whatsapp']};
 const fr=renderWorkspace(card,[],rights,'fr'),ar=renderWorkspace(card,[],rights,'ar');
 assert.match(fr,/&lt;img onerror/);assert.doesNotMatch(fr,/<img onerror/);
 assert.doesNotMatch(fr,/[\u0600-\u06ff]/);assert.doesNotMatch(ar,/Faites bonne|Votre profil|Brouillon|Présentation/);
 assert.match(fr,/id="preview-content"/);assert.match(fr,/name="name"/);assert.match(ar,/name="name_ar"/);
});
test('Admin counters reflect actual card statuses and preserve internal values',()=>{
 const cards=[{card_id:id,plan_code:'social',mode:'profile',status:'draft',overrides:{whatsapp:false}}];
 const html=renderAdmin(cards,[{id,name:'<script>danger</script>'}],'fr');
 assert.match(html,/data-stat="0">1/);assert.match(html,/data-stat="1">0/);assert.match(html,/data-stat="2">1/);
 assert.match(html,/&lt;script&gt;danger/);assert.doesNotMatch(html,/<script>danger/);
 assert.match(html,/value="draft" selected>Brouillon/);assert.match(html,/data-override="whatsapp"/);
});
