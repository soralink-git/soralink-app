export const VIDEO_TYPES=['video/mp4','video/webm','video/quicktime'];
export const MAX_VIDEO_BYTES=50*1024*1024;
export function mediaError(type:string,size:number){
 const video=VIDEO_TYPES.includes(type);if(!video&&!['image/jpeg','image/png','image/webp','application/pdf'].includes(type))return 'Format non accepté. Photos : JPG, PNG, WebP. Vidéos : MP4, WebM, MOV.';
 if(size<=0||size>(video?MAX_VIDEO_BYTES:10*1024*1024))return video?'Vidéo : maximum 50 Mo.':'Photo ou PDF : maximum 10 Mo.';
 return '';
}
export function recordedVideoUrl(value:unknown){return typeof value==='string'&&/^\/api\/upload\?key=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)?value:'';}
export function byteRange(header:string,size:number):{offset:number,length:number}|null{
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);if(!match||(!match[1]&&!match[2])||size<=0)return null;
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));let end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start||(!match[1]&&Number(match[2])===0))return null;
 return {offset:start,length:end-start+1};
}
