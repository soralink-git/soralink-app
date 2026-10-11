const translatedFields=['name','title','bio','text','description','address','section_title'];
export function languageContent(content={},lang='fr') {
 const result={...content};
 if(lang==='ar')for(const key of translatedFields)result[key]=content[key+'_ar']||'';
 if(Array.isArray(content.items))result.items=content.items.map(item=>lang==='ar'?{...item,label:item.label_ar||'',name:item.name_ar||'',category:item.category_ar||''}:{...item});
 return result;
}
export function saveLanguageContent(previous={},input={},lang='fr',module='') {
 const result={...previous};
 for(const [key,value] of Object.entries(input)) {
  if(key==='items')result.items=value.map((item,i)=>{
   const stored={...(previous.items?.[i]||{})};
   for(const [field,text] of Object.entries(item))stored[lang==='ar'&&['label','name','category'].includes(field)?field+'_ar':field]=text;
   return stored;
  });
  else result[lang==='ar'&&translatedFields.includes(key)?key+'_ar':key]=value;
 }
 return result;
}
