import {actionIcon} from './action-icons.js';
import {socialIcon} from './social-icons.js';
import {languageContent} from './content-language.js';
import {escapeHtml as e,safeUrl} from './domain.js';
import {orderedModules,sectionTitle} from './sections.js';
export function renderProfile(card,blocks=[],lang='fr',mediaOverrides={}) {
 const ar=lang==='ar',tr=(fr,arabic)=>ar?arabic:fr;
 const enabled=blocks.filter(x=>x.enabled),b=Object.fromEntries(enabled.map(x=>[x.module,languageContent(x.content,lang)]));
 const items=value=>Array.isArray(value)?value.filter(x=>x&&typeof x==='object'):[];
 const name=ar?(card.name_ar||'بطاقة'):card.name,title=ar?(card.title_ar||''):card.title,bio=ar?(card.bio_ar||''):card.bio;
 const resource=url=>mediaOverrides[url]&&/^blob:https?:/.test(mediaOverrides[url])?mediaOverrides[url]:safeUrl(url);
 const link=(label,url,icon='link')=>resource(url)?`<a class="profile-action" href="${e(resource(url))}" target="_blank" rel="noopener noreferrer" title="${e(label)}" aria-label="${e(label)}">${actionIcon(icon)}</a>`:'';
 const theme=['sage','ocean','terre'].includes(b.identity?.theme)?b.identity.theme:'sage';
 let html=`<section class="profile-wrap"><article class="profile theme-${theme}"><div class="cover" dir="ltr">SoraLink</div><div class="profile-content"><div class="avatar">${resource(b.identity?.image)?`<img src="${e(resource(b.identity.image))}" alt="${e(name)}" width="84" height="84">`:e(name?.slice(0,1)||'S')}</div><h1>${e(name)}</h1>${title?`<p class="subtitle">${e(title)}</p>`:''}${bio?`<p class="bio">${e(bio)}</p>`:''}`;
 const renderers={
 vcard:()=>`<div class="profile-action-list"><button class="button lime profile-text-action" id="vcard" title="${tr('Enregistrer le contact','سجّل الكونتاكت')}" aria-label="${tr('Enregistrer le contact','سجّل الكونتاكت')}"><strong>${tr('Enregistrer le contact','سجّل الكونتاكت')}</strong></button></div>`,
 contact_details:c=>{let out='';if(c.phone&&/^\+?[0-9 ()-]{6,25}$/.test(c.phone))out+=`<a class="profile-action" href="tel:${e(c.phone.replace(/[^+0-9]/g,''))}" title="${tr('Appeler','نتاصل')}" aria-label="${tr('Appeler','نتاصل')}">${actionIcon('phone')}</a>`;if(c.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))out+=`<a class="profile-action" href="mailto:${e(encodeURIComponent(c.email))}" title="${tr('Envoyer un email','نصيفط إيميل')}" aria-label="${tr('Envoyer un email','نصيفط إيميل')}">${actionIcon('mail')}</a>`;out+=link(tr('Itinéraire','الموقع'),c.maps_url,'pin');return(out?`<div class="profile-action-list">${out}</div>`:'')+(c.address?.trim()?`<p class="profile-address">${actionIcon('pin')}${e(c.address)}</p>`:'');},
 whatsapp:c=>{const n=String(c.number||'').replace(/\D/g,'');if(!/^\d{8,15}$/.test(n))return '';const brand=socialIcon('https://wa.me/'+n,'WhatsApp');return `<div class="social-icon-list"><a class="social-icon-link" href="https://wa.me/${n}" target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp">${brand.html}</a></div>`;},
 social_links:c=>{const links=items(c.items).map(x=>{const brand=socialIcon(x.url,x.label);return brand&&safeUrl(x.url)?`<a class="social-icon-link" href="${e(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer" title="${e(brand.name)}" aria-label="${e(brand.name)}">${brand.html}</a>`:link(x.label||tr('Lien','رابط'),x.url);}).filter(Boolean);return links.length?`<div class="social-icon-list">${links.join('')}</div>`:'';},
 gallery:c=>{const photos=items(c.items).filter(x=>resource(x.url));return photos.length?`<div class="gallery">${photos.map(x=>`<a href="${e(resource(x.url))}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${e(resource(x.url))}" alt="${e(x.label||tr('Réalisation','صورة'))}"></a>`).join('')}</div>`:'';},
 pdf_catalog:c=>{const a=link(tr('Consulter / télécharger le PDF','شوف الكتالوج PDF'),c.url,'file');return a?`<div class="profile-action-list">${a}</div>`:'';},
 opening_hours:c=>c.text?.trim()?`<p>${e(c.text).replace(/\n/g,'<br>')}</p>`:'',
 booking_link:c=>{const a=link(tr('Prendre rendez-vous','خد موعد'),c.url,'calendar');return a?`<div class="profile-action-list">${a}</div>`:'';},
 restaurant_menu:c=>items(c.items).filter(x=>x.name?.trim()).map(x=>`<div class="menu-item"><div><strong>${e(x.name)}</strong><p>${e(x.category)}</p></div><span>${e(x.price)} ${tr('dirhams','درهم')}</span></div>`).join(''),
 reviews_link:c=>{const a=link(tr('Partager votre avis Google','شارك الرأي ديالك فـ Google'),c.url,'star');return a?`<div class="profile-action-list">${a}</div>`:'';},
 event_program:c=>c.text?.trim()?`<p>${e(c.text).replace(/\n/g,'<br>')}</p>${link(tr('Plan d’accès','الموقع'),c.maps_url,'pin')}`:'',
 product_listing:c=>c.name?.trim()?`<h3>${e(c.name)}</h3>${c.price?`<strong>${e(c.price)} ${tr('dirhams','درهم')}</strong>`:''}<p>${e(c.description)}</p>${link(tr('Visite / vidéo','الفيديو'),c.video_url,'play')}`:''
 };
 const headings={gallery:tr('Nos réalisations','الخدمة ديالنا'),opening_hours:tr('Horaires','أوقات الخدمة'),restaurant_menu:tr('Notre menu','المنيو'),event_program:tr('Programme','البرنامج')};
 for(const module of orderedModules(enabled.map(x=>x.module),enabled)){if(module==='identity')continue;const c=b[module],body=renderers[module]?.(c);if(!body)continue;const heading=sectionTitle(c,headings[module]||'');html+=`<section class="profile-section" data-section="${module}">${heading?`<h2>${e(heading)}</h2>`:''}${body}</section>`;}
 html+=`<div class="profile-action-list profile-share"><button class="button secondary profile-text-action" id="share-card" title="${tr('Partager cette carte','بارطاجي البطاقة')}" aria-label="${tr('Partager cette carte','بارطاجي البطاقة')}"><strong>${tr('Partager cette carte','بارطاجي البطاقة')}</strong></button></div><p class="muted" style="margin-top:20px;text-align:center">${tr('Propulsé par','مع')} SoraLink</p></div></article></section>`;
 return html;
}
