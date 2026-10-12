import {cp,mkdir,rm,writeFile,readdir} from 'node:fs/promises';
await rm('dist/pages',{recursive:true,force:true});await mkdir('dist/pages',{recursive:true});
await cp('dist/client','dist/pages',{recursive:true});await mkdir('dist/pages/_worker.js',{recursive:true});
for(const file of await readdir('dist/server'))if(file!=='wrangler.json')await cp('dist/server/'+file,'dist/pages/_worker.js/'+file,{recursive:true});
await writeFile('dist/pages/_routes.json',JSON.stringify({version:1,include:['/*'],exclude:['/_next/static/*','/assets/*','/icons/*','/favicon.svg','/manifest.webmanifest','/sw.js','/offline.html','/og-soralink.png','/demo-design.svg']}));
console.log('Application Pages prête : dist/pages');
