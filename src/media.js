export const MEDIA_BUCKET='soralink-media';
export const MEDIA_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(identity|gallery|pdf_catalog)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/i;
export function mediaPath(url){if(typeof url!=='string'||!url.startsWith('/media/'))return null;const path=url.slice(7);return MEDIA_PATTERN.test(path)?path:null;}
export async function validateFile(file,module){
 const pdf=module==='pdf_catalog',limit=pdf?10*1024*1024:4*1024*1024;
 if(!file||!file.size||file.size>limit)return {error:'size',limit};
 const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const ascii=(a,b)=>String.fromCharCode(...bytes.slice(a,b));let type,ext;
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){type='image/jpeg';ext='jpg';}
 else if(bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10){type='image/png';ext='png';}
 else if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'){type='image/webp';ext='webp';}
 else if(ascii(0,5)==='%PDF-'){type='application/pdf';ext='pdf';}
 if(!type||(pdf?ext!=='pdf':ext==='pdf'))return {error:'type'};
 return {type,ext};
}
