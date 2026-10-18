const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {load,req} = require('./ts-loader.cjs');
const {clientDesignAllowed,designSettings} = load(path.resolve('app/lib/card-design.ts'));
const {applyCardStyle,applyCardTheme,cardStyles,cardPalettes} = load(path.resolve('app/lib/card-styles.ts'));
const {demoCard} = load(path.resolve('app/lib/demo-card.ts'));
test('simple presets, ambience and palette combinations remain available without changing admin sections',()=>{
  const old={...demoCard,textSize:'large',backgroundOpacity:48,sectionTitles:{fr:{services:'Offre'},ar:{}},hiddenSections:['appointments']};
  assert(clientDesignAllowed({...old,name:'Client'},old));
  for(const style of cardStyles) for(const theme of ['light','dark']) for(const palette of cardPalettes){
    const next={...applyCardTheme(applyCardStyle(old,style.id),theme),color:palette.color,buttonColor:palette.color};
    assert(clientDesignAllowed(next,old));
  }
  for(const patch of [{textSize:'extra'},{hiddenSections:[]},{sectionTitles:{fr:{services:'Changed'}}},{sectionOrder:['services','coordinates']},{backgroundOpacity:75},{backgroundPhoto:'/api/upload?key=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'},{cardFont:'classic'}]){
    assert.equal(clientDesignAllowed({...old,...patch},old),false,JSON.stringify(patch));
  }
  assert(clientDesignAllowed({name:'New'}));
  assert.equal(clientDesignAllowed({name:'New',textSize:'extra'}),false);
  assert.equal(designSettings(old).hiddenSections[0],'appointments');
});
test('admin section editor renders a full preview and localized controls without editing client content',()=>{
 const React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
 const Editor=load(path.resolve('app/admin-design-editor.tsx')).default;
 for(const ar of [false,true]){
  const html=renderToStaticMarkup(React.createElement(Editor,{profile:{id:'test',updated:'revision',pro_enabled:1,data:JSON.stringify(demoCard)},ar,onSaved(){},onClose(){}}));
  assert(html.includes(ar?'التخصيص المفصّل':'Personnalisation avancée'));
  assert(html.includes(ar?'سجّل الإعدادات':'Enregistrer les réglages'));
  assert.match(html,/inert=""/);
  assert.match(html,/profile-card card-design/);
  assert.match(html,/section-editor-row/);
 }
});
