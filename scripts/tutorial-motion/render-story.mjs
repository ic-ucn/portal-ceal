import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('../..'),work=path.join(root,'.data/video-story');
const serveUrl=await bundle({entryPoint:path.join(root,'scripts/tutorial-motion/src/story-entry.tsx'),publicDir:path.join(work,'public'),outDir:path.join(work,'story-bundle'),onProgress:p=>console.log('Bundle',p)});
const browser=await openBrowser('chrome',{browserExecutable:path.join(root,'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe')});
try{for(const lesson of ['semestre'])for(const format of ['desktop','mobile']){
 const inputProps=JSON.parse(await readFile(path.join(work,lesson,format+'.json'),'utf8'));
 const composition=await selectComposition({serveUrl,id:lesson==='semestre'?'Semestre':'Notas',inputProps,puppeteerInstance:browser});
 const opts={serveUrl,composition,inputProps,puppeteerInstance:browser};const folder=path.join(work,lesson,format);await mkdir(folder,{recursive:true});
 const seconds=inputProps.scenes.flatMap(scene=>[scene.start+.3,(scene.start+scene.end)/2,scene.end-.3]);
 for(const sec of seconds)await renderStill({...opts,frame:Math.round(sec*30),output:path.join(folder,`frame-${Math.round(sec*30)}.jpg`),imageFormat:'jpeg',jpegQuality:95});
 console.log('Stills',lesson,format);
 if(process.argv[2]!=='stills')await renderMedia({...opts,codec:'h264',crf:19,concurrency:2,outputLocation:path.join(folder,'silent.mp4'),onProgress:({progress})=>{if(progress===1)console.log('Rendered',lesson,format)}});
}}finally{await browser.close({silent:true});}
