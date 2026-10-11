import {actionIcon} from './action-icons.js';
import {socialIcon} from './social-icons.js';
import {languageContent} from './content-language.js';
import {escapeHtml as e,safeUrl} from './domain.js';
export function renderProfile(card,blocks=[],lang='fr',mediaOverrides={}) {
 const ar=lang==='ar',tr=(fr,arabic)=>ar?arabic:fr;
 const b=Object.fromEntries(blocks.filter(x=>x.enabled).map(x=>[x.module,languageContent(x.content,lang)]));
 const items=value=>Array.isArray(value)?value.filter(x=>x&&typeof x==='object'):[];
 const name=ar?(card.name_ar||'بطاقة'):card.name;
 const title=ar?(card.title_ar||''):card.title;
 const bio=ar?(card.bio_ar||''):card.bio;
 const resource=url=>mediaOverrides[url]&&/^blob:https?:/.test(mediaOverrides[url])?mediaOverrides[url]:safeUrl(url);
 const link=(label,url,icon='link')=>resource(url)?`<a class="profile-action" href="${e(resource(url))}" target="_blank" rel="noopener noreferrer" title="${e(label)}" aria-label="${e(label)}">${actionIcon(icon)}</a>`:'';
 const theme=['sage','ocean','terre'].includes(b.identity?.theme)?b.identity.theme:'sage';
 let html=`<section class="profile-wrap"><article class="profile theme-${theme}"><div class="cover">SoraLink</div><div class="profile-content"><div class="avatar">${resource(b.identity?.image)?`<img src="${e(resource(b.identity.image))}" alt="${e(name)}" width="84" height="84">`:e(name?.slice(0,1)||'S')}</div><h1>${e(name)}</h1><p class="subtitle">${e(title)}</p><p class="bio">${e(bio)}</p>`;

 html+='<div class="profile-action-list">';if(b.vcard)html+=`<button class="button lime profile-text-action" id="vcard" title="${tr('Enregistrer le contact','سجّل الكونتاكت')}" aria-label="${tr('Enregistrer le contact','سجّل الكونتاكت')}"><strong>${tr('Enregistrer le contact','سجّل الكونتاكت')}</strong></button>`;
 const c=b.contact_details||{};
 if(c.phone&&/^\+?[0-9 ()-]{6,25}$/.test(c.phone))html+=`<a class="profile-action" href="tel:${e(c.phone.replace(/[^+0-9]/g,''))}" title="${tr('Appeler','نتاصل')} · ${e(c.phone)}" aria-label="${tr('Appeler','نتاصل')} · ${e(c.phone)}">${actionIcon('phone')}</a>`;
 if(c.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))html+=`<a class="profile-action" href="mailto:${e(encodeURIComponent(c.email))}" title="${tr('Envoyer un email','نصيفط إيميل')} · ${e(c.email)}" aria-label="${tr('Envoyer un email','نصيفط إيميل')} · ${e(c.email)}">${actionIcon('mail')}</a>`;
 html+=link(tr('Itinéraire','الموقع'),c.maps_url,'pin');html+='</div>';
 if(c.address)html+=`<p class="profile-address">${actionIcon('pin')}${e(c.address)}</p>`;
 const wa=String(b.whatsapp?.number||'').replace(/\D/g,'');
 const networks=[...items(b.social_links?.items)];if(wa&&/^\d{8,15}$/.test(wa))networks.push({label:'WhatsApp',url:`https://wa.me/${wa}`});if(networks.length)html+='<div class="social-icon-list">'+networks.map(item=>{const brand=socialIcon(item.url,item.label);return brand&&safeUrl(item.url)?`<a class="social-icon-link" href="${e(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer" title="${e(brand.name)}" aria-label="${e(brand.name)}">${brand.html}</a>`:link(item.label||tr('Lien','رابط'),item.url);}).join('')+'</div>';
 if(items(b.gallery?.items).length)html+=`<section class="profile-section"><h2>${tr('Nos réalisations','الخدمة ديالنا')}</h2><div class="gallery">${items(b.gallery.items).filter(x=>resource(x.url)).map(x=>`<a href="${e(resource(x.url))}" target="_blank" rel="noopener noreferrer"><img loading="lazy" src="${e(resource(x.url))}" alt="${e(x.label||tr('Réalisation','صورة'))}"></a>`).join('')}</div></section>`;
 if(resource(b.pdf_catalog?.url))html+=`<section class="profile-section"><h2 class="sr-only">${tr('Catalogue','الكتالوج')}</h2><div class="profile-action-list">${link(tr('Consulter / télécharger le PDF','شوف الكتالوج PDF'),b.pdf_catalog.url,'file')}</div></section>`;
 if(b.opening_hours?.text)html+=`<section class="profile-section"><h2 class="icon-section-heading" title="${tr('Horaires','أوقات الخدمة')}">${actionIcon('clock')}<span class="sr-only">${tr('Horaires','أوقات الخدمة')}</span></h2><p>${e(b.opening_hours.text).replace(/\n/g,'<br>')}</p></section>`;
 html+=`<div class="profile-action-list">${link(tr('Prendre rendez-vous','خد موعد'),b.booking_link?.url,'calendar')}</div>`;
 if(items(b.restaurant_menu?.items).length)html+=`<section class="profile-section"><h2>${tr('Notre menu','المنيو')}</h2>${items(b.restaurant_menu.items).map(x=>`<div class="menu-item"><div><strong>${e(x.name)}</strong><p>${e(x.category)}</p></div><span>${e(x.price)} ${tr('dirhams','درهم')}</span></div>`).join('')}</section>`;
 html+=`<div class="profile-action-list">${link(tr('Partager votre avis Google','شارك الرأي ديالك فـ Google'),b.reviews_link?.url,'star')}</div>`;
 if(b.event_program?.text)html+=`<section class="profile-section"><h2>${tr('Programme','البرنامج')}</h2><p>${e(b.event_program.text).replace(/\n/g,'<br>')}</p>${link(tr('Plan d’accès','الموقع'),b.event_program.maps_url,'pin')}</section>`;
 if(b.product_listing)html+=`<section class="profile-section"><h2>${e(b.product_listing.name)}</h2><strong>${e(b.product_listing.price)} ${tr('dirhams','درهم')}</strong><p>${e(b.product_listing.description)}</p>${link(tr('Visite / vidéo','الفيديو'),b.product_listing.video_url,'play')}</section>`;
 html+=`<div class="profile-action-list profile-share"><button class="button secondary profile-text-action" id="share-card" title="${tr('Partager cette carte','بارطاجي البطاقة')}" aria-label="${tr('Partager cette carte','بارطاجي البطاقة')}"><strong>${tr('Partager cette carte','بارطاجي البطاقة')}</strong></button></div><p class="muted" style="margin-top:20px;text-align:center">${tr('Propulsé par','مع')} SoraLink</p></div></article></section>`;
 return html;
}
