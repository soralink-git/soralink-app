export const MODULES = {
 identity:['Identité','المعلومات'], social_links:['Réseaux sociaux','مواقع التواصل'], whatsapp:['WhatsApp','واتساب'],
 contact_details:['Coordonnées','معلومات الاتصال'], vcard:['Export contact','تسجيل الكونتاكت'], gallery:['Galerie','الصور'],
 pdf_catalog:['Catalogue PDF','الكتالوج'], opening_hours:['Horaires','أوقات الخدمة'], booking_link:['Prise de RDV','موعد'],
 restaurant_menu:['Menu','المنيو'], reviews_link:['Avis Google','آراء الزبناء'], event_program:['Programme','البرنامج'],
 product_listing:['Fiche produit','معلومات المنتوج']
};
export const PLANS = {
 social:{name:'Réseaux sociaux',modules:['identity','social_links','whatsapp']},
 pro:{name:'Contact professionnel',modules:['identity','social_links','whatsapp','contact_details','vcard']},
 vitrine:{name:'Vitrine',modules:['identity','social_links','whatsapp','contact_details','vcard','gallery','pdf_catalog','opening_hours']},
 entreprise:{name:'Entreprise',modules:['identity','social_links','whatsapp','contact_details','vcard','gallery','pdf_catalog','opening_hours','booking_link']},
 solution_speciale:{name:'Solution Spéciale',modules:['identity','whatsapp']}
};
export const SPECIAL = {menu:['restaurant_menu','opening_hours'],reviews:['reviews_link'],event:['event_program'],product:['product_listing','gallery','contact_details']};
export function resolveModules(plan, mode='profile', overrides={}) {
 const base=[...(PLANS[plan]?.modules||[]),...(plan==='solution_speciale'?(SPECIAL[mode]||[]):[])];
 return Object.keys(MODULES).filter(m=>overrides[m]===false?false:overrides[m]===true||base.includes(m));
}
export function safeUrl(value) {
 try { const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null; } catch { return null; }
}
export function validId(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value||''); }
export function escapeHtml(value) {return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const esc = value => String(value??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function fold(line) {
 const chunks=[];let part='',bytes=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>75){chunks.push(part);part=' ';bytes=1;}part+=c;bytes+=n;}chunks.push(part);return chunks.join('\r\n');
}
export function createVCard(card,contact={},origin='https://soralink.link') {
 const lines=['BEGIN:VCARD','VERSION:3.0',`N:${esc(card.name)};;;;`,`FN:${esc(card.name)}`,`TITLE:${esc(card.title)}`];
 if(contact.phone)lines.push(`TEL;TYPE=CELL:${esc(contact.phone)}`);
 if(contact.email)lines.push(`EMAIL:${esc(contact.email)}`);
 if(contact.address)lines.push(`ADR;TYPE=WORK:;;${esc(contact.address)};;;;`);
 lines.push(`URL:${origin}/c/${encodeURIComponent(card.id)}`,`NOTE:${esc(card.bio)}`,'END:VCARD');return lines.map(fold).join('\r\n')+'\r\n';
}
