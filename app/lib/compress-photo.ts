const PHOTO_TYPES=['image/jpeg','image/png','image/webp'];
export const MAX_SOURCE_PHOTO_BYTES=40*1024*1024;
export async function compressPhoto(file:File):Promise<File>{
 if(!PHOTO_TYPES.includes(file.type))return file;
 if(file.size>MAX_SOURCE_PHOTO_BYTES)throw new Error('Photo trop volumineuse : 40 Mo maximum avant compression.');
 const url=URL.createObjectURL(file);const image=new Image();
 try{
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Photo illisible. Choisissez une photo JPG, PNG ou WebP.'));image.src=url;});
  const w=image.naturalWidth,h=image.naturalHeight;if(!w||!h)throw new Error('Photo invalide.');
  const scale=Math.min(1,1600/Math.max(w,h));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(w*scale));canvas.height=Math.max(1,Math.round(h*scale));
  try{
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Compression indisponible sur cet appareil.');
   ctx.drawImage(image,0,0,canvas.width,canvas.height);
   // Keep transparency for PNG/WebP; photographs use JPEG at 85% quality.
   const type=file.type==='image/jpeg'?'image/jpeg':'image/webp';
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Compression de la photo impossible.')),type,.85));
   if(scale===1&&blob.size>=file.size)return file;
   const ext=blob.type==='image/jpeg'?'jpg':blob.type==='image/webp'?'webp':'png';
   return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.'+ext,{type:blob.type,lastModified:file.lastModified});
  }finally{canvas.width=canvas.height=0;}
 }finally{image.onload=image.onerror=null;URL.revokeObjectURL(url);}
}
