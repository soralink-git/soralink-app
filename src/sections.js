import {MODULES} from './domain.js';
export function orderedModules(modules,blocks=[]){
 const unique=[...new Set(modules)].filter(m=>Object.hasOwn(MODULES,m));
 const rows=new Map(blocks.map(b=>[b.module,b]));
 const fallback=Object.keys(MODULES);
 const position=m=>{const raw=rows.get(m)?.content?._position;const n=Number(raw);return typeof raw==='string'&&/^\d{1,5}$/.test(raw)&&n<=10000?n:1000+fallback.indexOf(m);};
 return unique.sort((a,b)=>a==='identity'?-1:b==='identity'?1:position(a)-position(b)||fallback.indexOf(a)-fallback.indexOf(b));
}
export function sectionTitle(content,fallback=''){return typeof content.section_title==='string'&&content.section_title.trim()?content.section_title.trim().slice(0,120):fallback;}
