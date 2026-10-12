export type MailEnv={DB:D1Database,RESEND_API_KEY?:string,EMAIL_FROM?:string,PUBLIC_SITE_URL?:string,NOTIFICATIONS_ENABLED?:string};
export function mailReady(e:MailEnv){try{return e.NOTIFICATIONS_ENABLED==='true'&&!!e.RESEND_API_KEY&&!!e.EMAIL_FROM&&new URL(e.PUBLIC_SITE_URL||'').protocol==='https:';}catch{return false;}}
export function validEmail(v:unknown){return typeof v==='string'&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
const label=(v:string)=>({devis:'devis',commande:'commande',rdv:'rendez-vous'} as Record<string,string>)[v]||'demande';
export function mailStatement(e:MailEnv,p:any,r:any,event:'new'|'confirmed'|'cancelled',revision=0){
 const recipient=event==='new'?p.email:r.email;
 if(!mailReady(e)||!validEmail(recipient))return [];
 const d=JSON.parse(p.data);const professional=String(d.business||d.name||'Votre professionnel').slice(0,120);
 const slot=r.slot?String(r.slot).replace('T',' à ')+' (heure du Maroc)':'';
 const intro=event==='new'?'Une nouvelle demande de '+label(r.kind)+' vous attend.':event==='confirmed'?'Votre rendez-vous est confirmé.':'Votre rendez-vous est annulé.';
 const subject=event==='new'?'SoraLink — Nouvelle demande de '+label(r.kind):'SoraLink — Rendez-vous '+(event==='confirmed'?'confirmé':'annulé');
 const darija=event==='new'?'توصّلتي بطلب جديد. دخل للحساب ديالك باش تشوفو.':event==='confirmed'?'الموعد ديالك تأكد.':'الموعد ديالك تلغى.';
 const body=[intro,darija,'',professional,event==='new'?'Client : '+r.name:'Bonjour '+r.name+',',r.service?'Prestation : '+r.service:'',slot,event==='new'?'Téléphone : '+r.phone:'','',event==='new'?'Consultez et traitez cette demande dans votre espace : '+new URL('/?app=1',e.PUBLIC_SITE_URL).href:'Pour toute question, contactez votre professionnel via sa carte : '+new URL('/c/'+p.id,e.PUBLIC_SITE_URL).href,'','SoraLink · سورالينك'].filter(Boolean).join('\n');
 const now=new Date().toISOString();const id=r.id+':'+event+':'+revision;
 // For a status change, enqueue only if its version was committed in this batch.
 const sql=event==='new'?"INSERT OR IGNORE INTO notifications(id,profile,request_id,recipient,subject,body,created,next_attempt) VALUES(?,?,?,?,?,?,?,?)":"INSERT OR IGNORE INTO notifications(id,profile,request_id,recipient,subject,body,created,next_attempt) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM requests WHERE id=? AND status=? AND notification_revision=?)";
 const args:any[]=[id,p.id,r.id,recipient,subject,body,now,now];if(event!=='new')args.push(r.id,event,revision);
 return [e.DB.prepare(sql).bind(...args)];
}
export async function sendPending(e:MailEnv,send:typeof fetch=fetch){
 if(!mailReady(e))return;
 const now=new Date().toISOString();
 // Do not replay ambiguous sends after the provider’s idempotency window.
 await e.DB.prepare("UPDATE notifications SET state='failed',error='expired' WHERE state IN ('pending','processing') AND created<?").bind(new Date(Date.now()-23*3600000).toISOString()).run();
 const rows=await e.DB.prepare("SELECT * FROM notifications WHERE state IN ('pending','processing') AND next_attempt<=? AND attempts<5 ORDER BY created LIMIT 10").bind(now).all<any>();
 for(const row of rows.results){
  const lease=new Date(Date.now()+120000).toISOString();
  const claim=await e.DB.prepare("UPDATE notifications SET state='processing',next_attempt=?,attempts=attempts+1 WHERE id=? AND state IN ('pending','processing') AND next_attempt<=? AND attempts=?").bind(lease,row.id,now,row.attempts).run();
  if(claim.meta.changes!==1)continue;
  try{
   const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+e.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':row.id},body:JSON.stringify({from:e.EMAIL_FROM,to:[row.recipient],subject:row.subject,text:row.body}),signal:AbortSignal.timeout(15000)});
   const result:any=await response.json();
   if(!response.ok||!result.id)throw new Error('provider_http_'+response.status);
   await e.DB.prepare("UPDATE notifications SET state='accepted',sent_at=?,provider_id=?,error=NULL WHERE id=? AND state='processing' AND next_attempt=?").bind(new Date().toISOString(),result.id,row.id,lease).run();
  }catch(error){
   const attempt=row.attempts+1;const code=error instanceof Error&&/^provider_http_\d+$/.test(error.message)?error.message:'network_error';
   const permanent=['provider_http_400','provider_http_401','provider_http_403','provider_http_422'].includes(code);
   await e.DB.prepare('UPDATE notifications SET state=?,error=?,next_attempt=? WHERE id=? AND state=\'processing\' AND next_attempt=?').bind(attempt>=5||permanent?'failed':'pending',code,new Date(Date.now()+Math.pow(2,attempt)*60000).toISOString(),row.id,lease).run();
  }
 }
}
