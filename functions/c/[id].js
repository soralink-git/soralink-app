import {config} from '../../src/config.js';
import {validId,escapeHtml as e} from '../../src/domain.js';
import {renderProfile} from '../../src/profile.js';
export async function onRequestGet({request,params,env}) {
 const headers={'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; connect-src 'self' ${config.supabaseUrl}; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`};
 if(!validId(params.id))return new Response('<h1>Carte introuvable</h1><a href="/">SoraLink</a>',{status:404,headers});
 try {
 const apiHeaders={apikey:config.supabaseKey};
 const [cardRes,blockRes]=await Promise.all([
 fetch(`${config.supabaseUrl}/rest/v1/sl_cards?id=eq.${params.id}&select=id,name,title,bio,name_ar,title_ar,bio_ar`,{headers:apiHeaders,signal:AbortSignal.timeout(8000)}),
 fetch(`${config.supabaseUrl}/rest/v1/sl_blocks?card_id=eq.${params.id}&select=module,content,enabled`,{headers:apiHeaders,signal:AbortSignal.timeout(8000)})]);
 if(!cardRes.ok||!blockRes.ok)throw Error('Backend unavailable');
 const [cards,blocks]=await Promise.all([cardRes.json(),blockRes.json()]);
 if(!cards[0])return new Response('<h1>Carte introuvable ou indisponible</h1><a href="/">SoraLink</a>',{status:404,headers});
 const card=cards[0],url=config.canonicalOrigin+'/c/'+card.id;
 const shell=await env.ASSETS.fetch(new Request(new URL('/index.html',request.url)));if(!shell.ok)throw Error('Shell unavailable');
 let html=await shell.text();
 html=html.replace(/<title>.*?<\/title>/,()=>`<title>${e(card.name)} · SoraLink</title>`)
 .replace(/<meta name="description"[^>]*>/,()=>`<meta name="description" content="${e(card.bio.slice(0,160))}">`)
 .replace(/<meta property="og:title"[^>]*>/,()=>`<meta property="og:title" content="${e(card.name)} · SoraLink">`)
 .replace(/<meta property="og:description"[^>]*>/,()=>`<meta property="og:description" content="${e(card.title)}">`)
 .replace('</head>',()=>`<meta property="og:url" content="${e(url)}"><meta property="og:type" content="profile"><link rel="canonical" href="${e(url)}"></head>`)
 .replace(/<main id="main">[\s\S]*?<\/main>/,()=>`<main id="main" data-card="${e(JSON.stringify({card,blocks}))}">${renderProfile(card,blocks)}</main>`);
 return new Response(html,{headers});
 } catch {return new Response('<h1>Service momentanément indisponible</h1><p>Réessayez dans un instant.</p><a href="/">SoraLink</a>',{status:503,headers});}
}
