import test from 'node:test';
import assert from 'node:assert/strict';
import {languageContent,saveLanguageContent} from '../src/content-language.js';
import {renderProfile} from '../src/profile.js';
test('A translated module renders only the selected language',()=>{
 const card={name:'Entreprise française',name_ar:'المقاولة',title:'Activité française',title_ar:'النشاط',bio:'Présentation française',bio_ar:'التقديم'};
 const blocks=[{module:'opening_hours',enabled:true,content:{text:'Lundi au samedi',text_ar:'الاثنين حتى للسبت'}},{module:'restaurant_menu',enabled:true,content:{items:[{category:'Boissons',category_ar:'مشروبات',name:'Café français',name_ar:'قهوة',price:'15'}]}}];
 const fr=renderProfile(card,blocks,'fr'),ar=renderProfile(card,blocks,'ar');
 assert.match(fr,/Lundi au samedi/);assert.doesNotMatch(fr,/[\u0600-\u06ff]/);
 assert.match(ar,/الاثنين حتى للسبت/);assert.doesNotMatch(ar,/française|français|Lundi|Boissons/);
 assert.doesNotMatch(renderProfile({...card,title_ar:'',bio_ar:''},blocks,'ar'),/Activité française|Présentation française/);
});
test('Editing one language keeps the other language and shared links',()=>{
 const previous={text:'Horaires français',text_ar:'أوقات الخدمة',items:[{label:'Réalisation',label_ar:'الخدمة',url:'https://example.org/1'}]};
 const saved=saveLanguageContent(previous,{text:'مواعيد جديدة',items:[{label:'صورة',url:'https://example.org/2'}]},'ar');
 assert.equal(saved.text,previous.text);assert.equal(saved.text_ar,'مواعيد جديدة');
 assert.equal(saved.items[0].label,'Réalisation');assert.equal(saved.items[0].label_ar,'صورة');
 assert.equal(languageContent(saved,'ar').items[0].url,'https://example.org/2');
 assert.equal(languageContent({text:'French only'},'ar').text,'');
});
test('Card themes use only approved styles',()=>{
 const card={name:'Test',title:'',bio:''};
 assert.match(renderProfile(card,[{module:'identity',enabled:true,content:{theme:'ocean'}}]),/theme-ocean/);
 const html=renderProfile(card,[{module:'identity',enabled:true,content:{theme:'\" onclick=alert(1)'}}]);
 assert.match(html,/theme-sage/);assert.doesNotMatch(html,/onclick=alert/);
});
