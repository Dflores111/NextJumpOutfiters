import {build} from 'vite';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
await build({build:{outDir:'dist/client',emptyOutDir:true}});
const template=await readFile('dist/client/index.html','utf8');
await build({
 plugins:[{name:'next-jump-html',resolveId(id){if(id==='virtual:next-jump-template')return '\0'+id},load(id){if(id==='\0virtual:next-jump-template')return 'export default '+JSON.stringify(template)}}],
 ssr:{noExternal:true,target:'webworker'},
 build:{ssr:true,outDir:'dist/server',emptyOutDir:true,copyPublicDir:false,rollupOptions:{input:{index:'src/hosted-worker.js','entry-server':'src/entry-server.jsx'},output:{entryFileNames:'[name].js'}}},
});
await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));
await writeFile('dist/server/wrangler.json',JSON.stringify({name:'next-jump-outfitters',main:'index.js',compatibility_date:'2026-01-01',compatibility_flags:['nodejs_compat'],assets:{directory:'../client',binding:'ASSETS',run_worker_first:true},d1_databases:[{binding:'DB',database_name:'next-jump-preview',database_id:'00000000-0000-0000-0000-000000000000',migrations_dir:'../../drizzle'}]},null,2)+'\n');
