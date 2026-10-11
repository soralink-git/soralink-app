import {faInstagram,faTiktok,faLinkedin,faWhatsapp,faFacebook,faYoutube,faXTwitter,faSnapchat,faTelegram,faPinterest} from '@fortawesome/free-brands-svg-icons';
import {escapeHtml as e} from './domain.js';
const brands=[['instagram.com','Instagram',faInstagram],['tiktok.com','TikTok',faTiktok],['linkedin.com','LinkedIn',faLinkedin],['wa.me','WhatsApp',faWhatsapp],['whatsapp.com','WhatsApp',faWhatsapp],['facebook.com','Facebook',faFacebook],['fb.com','Facebook',faFacebook],['youtube.com','YouTube',faYoutube],['youtu.be','YouTube',faYoutube],['x.com','X',faXTwitter],['twitter.com','X',faXTwitter],['snapchat.com','Snapchat',faSnapchat],['t.me','Telegram',faTelegram],['telegram.me','Telegram',faTelegram],['pinterest.com','Pinterest',faPinterest]];
export function socialBrand(url){try{const host=new URL(url).hostname.toLowerCase();return brands.find(([domain])=>host===domain||host.endsWith('.'+domain));}catch{return null;}}
export function socialIcon(url,label=''){
 const brand=socialBrand(url);if(!brand)return null;
 const [,name,definition]=brand,[width,height,,,path]=definition.icon;
 return {name,html:`<svg class="brand-icon" width="24" height="24" viewBox="0 0 ${width} ${height}" role="img" aria-label="${e(name)}"><path fill="currentColor" d="${path}"/></svg>`};
}
