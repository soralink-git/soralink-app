import {config} from '../src/config.js';
export async function onRequestGet({request}) {
 const slug=new URL(request.url).searchParams.get('u');
 if(!/^[a-z0-9-]{1,64}$/.test(slug||''))return new Response('Carte introuvable',{status:404});
 try {
 const r=await fetch(`${config.supabaseUrl}/rest/v1/sl_aliases?slug=eq.${encodeURIComponent(slug)}&select=card_id`,{headers:{apikey:config.supabaseKey},signal:AbortSignal.timeout(8000)});
 if(!r.ok)throw Error('Unavailable');const rows=await r.json();
 if(!rows[0])return new Response('Carte introuvable',{status:404});
 return new Response(null,{status:302,headers:{Location:config.canonicalOrigin+'/c/'+rows[0].card_id,'Cache-Control':'no-store'}});
 }catch{return new Response('Service momentanément indisponible',{status:503});}
}
