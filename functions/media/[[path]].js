import {config} from '../../src/config.js';
import {MEDIA_BUCKET,MEDIA_PATTERN} from '../../src/media.js';
export async function onRequestGet({params}){
 const path=Array.isArray(params.path)?params.path.join('/'):params.path;
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Referrer-Policy':'no-referrer'};
 if(!MEDIA_PATTERN.test(path||''))return new Response('Fichier introuvable',{status:404,headers});
 try{
  const response=await fetch(`${config.supabaseUrl}/storage/v1/object/${MEDIA_BUCKET}/${path}`,{headers:{apikey:config.supabaseKey,Authorization:'Bearer '+config.supabaseKey},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return new Response('Fichier indisponible',{status:404,headers});
  const ext=path.split('.').at(-1).toLowerCase(),type={jpg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf'}[ext];
  return new Response(response.body,{headers:{...headers,'Content-Type':type,'Content-Disposition':`${ext==='pdf'?'attachment':'inline'}; filename="soralink.${ext}"`}});
 }catch{return new Response('Fichier indisponible',{status:503,headers});}
}
