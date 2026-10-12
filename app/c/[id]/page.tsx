import App from '../../ui';
import {db,active} from '../../lib/server';
import {publicCardData} from '../../lib/public-card';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 try{const profile:any=await db().prepare('SELECT * FROM profiles WHERE id=? AND published=1').bind(id).first();
 if(profile&&active(profile)){const d=publicCardData(JSON.parse(profile.data),!!profile.pro_enabled);const title=String(d.business||d.name||'Carte professionnelle').slice(0,120)+' — SoraLink';const description=String(d.bio||'Découvrez cette carte professionnelle, ses contenus et ses coordonnées.').slice(0,180);return {title,description,openGraph:{type:'website',siteName:'SoraLink',title,description,url:'/c/'+encodeURIComponent(id),images:[{url:'/og-soralink.png',width:1200,height:630,alt:'Carte professionnelle SoraLink'}]},twitter:{card:'summary_large_image',title,description,images:['/og-soralink.png']}};}
 }catch{}
 return {title:'Carte indisponible — SoraLink',robots:{index:false,follow:false},openGraph:{title:'SoraLink',description:'Carte professionnelle indisponible',images:['/og-soralink.png']}};
}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <App cardId={id}/>}
