import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {readFile,mkdir} from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('../..'),work=path.join(root,'output/release-20261026/tutorial-silent/work');
const serveUrl=await bundle({entryPoint:path.join(root,'scripts/tutorial-motion/src/silent-entry.tsx'),publicDir:path.join(work,'public'),outDir:path.join(work,'bundle')});
const prefix=process.argv[2]==='prefix';
const browser=await openBrowser('chrome',{browserExecutable:path.join(root,'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe')});
try{for(const format of ['desktop','mobile']){
 const inputProps=JSON.parse(await readFile(path.join(work,format+'.json'),'utf8'));const composition=await selectComposition({serveUrl,id:'GuiaSilenciosa',inputProps,puppeteerInstance:browser});const opts={serveUrl,composition,inputProps,puppeteerInstance:browser};const folder=path.join(work,format);await mkdir(folder,{recursive:true});
 for(const frame of [45,...inputProps.scenes.filter(s=>!prefix||s.start<20).flatMap(s=>[Math.round((s.start+.5)*30),Math.round((s.end-1)*30)])])await renderStill({...opts,frame,output:path.join(folder,'frame-'+frame+'.jpg'),imageFormat:'jpeg',jpegQuality:90});
 console.log('Stills ready',format);
 if(process.argv[2]!=='stills')await renderMedia({...opts,codec:'h264',crf:20,concurrency:3,...(prefix?{frameRange:[0,629]}:{}),outputLocation:path.join(folder,prefix?'prefix.mp4':'silent.mp4'),onProgress:({progress})=>{if(progress===1)console.log('Rendered',format)}});
}}finally{await browser.close({silent:true});}
