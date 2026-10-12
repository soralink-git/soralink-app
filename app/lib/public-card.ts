import {normalizeAppearance} from './personalization';
import {normalizeCatalogue} from './catalogue';
import {activePromotions} from './promotions';
import {recordedVideoUrl} from './content-media';
import {normalizeSchedule} from './schedule';
const textFields=['name','job','business','bio','phone','email','address','whatsapp','website','instagram','facebook','linkedin','tiktok','youtube','x','mapsUrl','mapDestination','color','template','avatar','cover','pdf','video'];
const socialFields=['instagram','facebook','linkedin','tiktok','youtube','x'];
// Explicit public projection: saved account data is never returned wholesale.
export function publicCardData(saved:any,pro:boolean){
 const d=normalizeAppearance(saved),out:Record<string,any>={};
 for(const key of textFields)out[key]=typeof d[key]==='string'?d[key]:'';
 for(const key of ['textColor','buttonColor','textSize','buttonSize','buttonStyle','cardTheme','cardFont','buttonShape','avatarShape','sectionOrder','hiddenSections','sectionTitles','hidePhone','hideEmail','hideLocation','hideSocial','hideWhatsApp'])out[key]=d[key];
 out.pro=pro;out.services=normalizeCatalogue(d.services).filter(item=>item.name);
 out.promotions=activePromotions(d.promotions);
 out.photos=Array.isArray(d.photos)?d.photos.filter((p:unknown)=>typeof p==='string').slice(0,10):[];
 out.recordedVideo=recordedVideoUrl(d.recordedVideo);
 out.appointmentServices=pro?normalizeSchedule(d).appointmentServices:[];
 if(d.hidePhone)out.phone='';if(d.hideEmail)out.email='';if(d.hideWhatsApp)out.whatsapp='';
 if(d.hideLocation)for(const key of ['address','mapsUrl','mapDestination'])out[key]='';
 if(d.hideSocial)for(const key of socialFields)out[key]='';
 const hidden=new Set(d.hiddenSections);
 if(hidden.has('coordinates'))for(const key of ['phone','email','whatsapp','address','mapsUrl','mapDestination'])out[key]='';
 if(hidden.has('social'))for(const key of socialFields)out[key]='';
 if(hidden.has('promotions'))out.promotions=[];
 if(hidden.has('appointments')){out.appointmentServices=[];}
 if(hidden.has('services'))out.services=[];
 if(hidden.has('photos'))out.photos=[];
 if(hidden.has('pdf'))out.pdf='';
 if(hidden.has('video')){out.video='';out.recordedVideo='';}
 if(hidden.has('links'))out.website='';
 for(const lang of ['fr','ar'])for(const key of Object.keys(out.sectionTitles[lang]))if(hidden.has(key)||key==='appointments'&&!pro)delete out.sectionTitles[lang][key];
 return out;
}
