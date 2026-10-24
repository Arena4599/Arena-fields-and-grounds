import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const html=readFileSync('work/page.html','utf8');
const api=readFileSync('worker/api.js','utf8');
writeFileSync('worker/index.js','const HTML='+JSON.stringify(html)+';\n'+api);
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
copyFileSync('worker/index.js','dist/server/index.js');copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
