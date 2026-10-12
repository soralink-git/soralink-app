import {env} from 'cloudflare:workers';
import {db} from './server';
export const STORAGE_BYTES=400*1024*1024;
export const MAX_ASSETS=80;
export function mediaKeys(d:any):string[]{
 const values=[d?.avatar,d?.cover,d?.pdf,d?.recordedVideo,...(Array.isArray(d?.photos)?d.photos:[]),...(Array.isArray(d?.services)?d.services.map((s:any)=>s.image):[]),...(Array.isArray(d?.promotions)?d.promotions.map((p:any)=>p.image):[])];
 return [...new Set(values.filter((v:unknown)=>typeof v==='string').map((v:string)=>/^\/api\/upload\?key=([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/.exec(v)?.[1]).filter((v):v is string=>!!v))];
}
export async function adoptLegacy(owner:string,profile:any){
 if(!env.BUCKET||!profile)return;
 for(const key of mediaKeys(JSON.parse(profile.data))){
  if(await db().prepare('SELECT key FROM media_assets WHERE key=?').bind(key).first())continue;
  const object=await env.BUCKET.head(key);if(!object)continue;
  await db().prepare("INSERT OR IGNORE INTO media_assets(key,owner,bytes,state,created) VALUES(?,?,?,'ready',?)").bind(key,owner,object.size,new Date().toISOString()).run();
 }
}
export async function storageUsage(owner:string){const row:any=await db().prepare("SELECT COALESCE(SUM(bytes),0) bytes,COUNT(*) files FROM media_assets WHERE owner=? AND state!='deleted'").bind(owner).first();return {bytes:row.bytes,files:row.files,limitBytes:STORAGE_BYTES,limitFiles:MAX_ASSETS};}
export async function reserveMedia(owner:string,key:string,bytes:number){
 const result=await db().prepare("INSERT INTO media_assets(key,owner,bytes,state,created) SELECT ?,?,?,'pending',? WHERE (SELECT COALESCE(SUM(bytes),0) FROM media_assets WHERE owner=? AND state!='deleted')+?<=? AND (SELECT COUNT(*) FROM media_assets WHERE owner=? AND state!='deleted')<?").bind(key,owner,bytes,new Date().toISOString(),owner,bytes,STORAGE_BYTES,owner,MAX_ASSETS).run();return result.meta.changes===1;
}
export async function validateMedia(owner:string,d:any,previous:any){
 const retained=new Set(mediaKeys(previous));for(const key of mediaKeys(d)){const asset:any=await db().prepare('SELECT owner,state FROM media_assets WHERE key=?').bind(key).first();if(!asset){if(retained.has(key))continue;return false;}if(asset.state!=='ready'||(asset.owner!==owner&&!retained.has(key)))return false;}return true;
}
export async function cleanupMedia(owner:string){
 if(!env.BUCKET)return false;
 const cutoff=new Date(Date.now()-24*3600000).toISOString();
 await db().prepare("UPDATE media_assets SET state='deleting' WHERE owner=? AND state IN ('ready','pending') AND created<? AND NOT EXISTS(SELECT 1 FROM profiles WHERE profiles.data LIKE '%'||media_assets.key||'%')").bind(owner,cutoff).run();
 const items=await db().prepare("SELECT key FROM media_assets WHERE owner=? AND state='deleting' LIMIT 80").bind(owner).all<{key:string}>();
 let complete=true;for(const asset of items.results){try{await env.BUCKET.delete(asset.key);await db().prepare("UPDATE media_assets SET state='deleted' WHERE key=? AND owner=? AND state='deleting'").bind(asset.key,owner).run();}catch{complete=false;}}
 return complete;
}
export async function saveProfileWithMedia(owner:string,p:any,id:string,d:any,published:boolean,email:string){
 const old=p?JSON.parse(p.data):{},keys=mediaKeys(d),removed=mediaKeys(old).filter(key=>!keys.includes(key));
 const stamp=new Date().toISOString(),data=JSON.stringify(d);
 const valid=keys.length?"NOT EXISTS(SELECT 1 FROM media_assets WHERE key IN ("+keys.map(()=>'?').join(',')+") AND state!='ready')":'1=1';
 const save=db().prepare('INSERT INTO profiles(id,owner,data,published,updated,email) SELECT ?,?,?,?,?,? WHERE '+valid+' ON CONFLICT(owner) DO UPDATE SET data=excluded.data,published=excluded.published,updated=excluded.updated,email=excluded.email WHERE profiles.updated=? AND profiles.data=? AND profiles.published=?').bind(id,owner,data,published?1:0,stamp,email,...keys,p?.updated||'',p?.data||'',p?.published||0);
 const deletions=removed.map(key=>db().prepare("UPDATE media_assets SET state='deleting' WHERE key=? AND owner=? AND state='ready' AND EXISTS(SELECT 1 FROM profiles WHERE owner=? AND updated=? AND data=?) AND NOT EXISTS(SELECT 1 FROM profiles WHERE data LIKE ?)").bind(key,owner,owner,stamp,data,'%'+key+'%'));
 const result=await db().batch([save,...deletions]);return result[0].meta.changes===1;
}
