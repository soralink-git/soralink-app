const domains:Record<string,string[]>={instagram:['instagram.com'],facebook:['facebook.com','fb.com','fb.me'],linkedin:['linkedin.com','lnkd.in'],tiktok:['tiktok.com'],youtube:['youtube.com','youtu.be'],x:['x.com','twitter.com']};
export function socialLink(network:string,value:unknown){
 if(typeof value!=='string')return '';
 const input=value.trim();if(!input)return '';
 try{
  const explicit=/^https?:\/\//i.test(input);
  if(!explicit&&/^[a-z][a-z\d+.-]*:/i.test(input))return '';
  const u=new URL(explicit?input:'https://'+input.replace(/^\/\//,''));
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return '';
  if(!explicit&&!(domains[network]||[]).some(domain=>u.hostname===domain||u.hostname.endsWith('.'+domain)))return '';
  return u.href;
 }catch{return '';}
}
