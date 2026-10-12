import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../chatgpt-auth';
import {authClient} from './supabase';
export function db(){if(!env.DB)throw new Error('Storage unavailable');return env.DB;}
export async function identity(){let user:{userId:string,email:string,displayName:string}|null=null;let source='';
 if(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY){const s=await authClient();const {data,error}=await s.auth.getUser();if(!error&&data.user?.email&&data.user.email_confirmed_at){const email=data.user.email.toLowerCase();const owner='sb:'+data.user.id;user={userId:owner,email,displayName:email};source='email';const existing=await db().prepare('SELECT id FROM profiles WHERE owner=?').bind(owner).first();if(!existing){const matches=await db().prepare('SELECT id,owner FROM profiles WHERE lower(email)=? AND owner<>? LIMIT 2').bind(email,owner).all();const old:any=matches.results.length===1?matches.results[0]:null;if(old){await db().batch([db().prepare('UPDATE profiles SET owner=? WHERE id=? AND owner=?').bind(owner,old.id,old.owner),db().prepare('UPDATE orders SET owner=? WHERE owner=? AND EXISTS (SELECT 1 FROM profiles WHERE id=? AND owner=?)').bind(owner,old.owner,old.id,owner),db().prepare('UPDATE media_assets SET owner=? WHERE owner=? AND EXISTS (SELECT 1 FROM profiles WHERE id=? AND owner=?)').bind(owner,old.owner,old.id,owner)]);}}}}
 if(!user&&(await cookies()).get('soratap_legacy')?.value==='1'){user=await getChatGPTUser();if(user)source='chatgpt';}
 return {user,source,admin:!!user&&!!env.SORATAP_ADMIN_EMAIL&&user.email.toLowerCase()===env.SORATAP_ADMIN_EMAIL.toLowerCase()};}
export const json=(v:unknown,s=200)=>Response.json(v,{status:s,headers:{'Cache-Control':'no-store'}});
export function active(p:any){return p.state!=='suspended'&&(!p.expires||new Date(p.expires).getTime()+15*86400000>Date.now());}
export async function log(actor:string,action:string,target:string){await db().prepare('INSERT INTO audit(id,actor,action,target,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),actor,action,target,new Date().toISOString()).run();}
