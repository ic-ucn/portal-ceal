import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('../..'),work=path.join(root,'.data/news-video');
const sceneFilter=process.argv.find(arg=>arg.startsWith('--scene='))?.slice(8);
const formatFilter=process.argv.find(arg=>arg.startsWith('--format='))?.slice(9);
if(formatFilter&&!['desktop','mobile'].includes(formatFilter))throw new Error('Unknown format: '+formatFilter);
const serveUrl=await bundle({entryPoint:path.join(root,'scripts/tutorial-motion/src/news-entry.tsx'),publicDir:path.join(work,'public'),outDir:path.join(work,'bundle')});
const browser=await openBrowser('chrome',{browserExecutable:path.join(root,'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe')});
try { for(const format of (formatFilter?[formatFilter]:['desktop','mobile'])){
 const inputProps=JSON.parse(await readFile(path.join(work,format+'.json'),'utf8'));
 const composition=await selectComposition({serveUrl,id:'Novedades',inputProps,puppeteerInstance:browser});
 const opts={serveUrl,composition,inputProps,puppeteerInstance:browser};const folder=path.join(work,format);await mkdir(folder,{recursive:true});
 const selectedScenes=sceneFilter?inputProps.scenes.filter(s=>sceneFilter.split(',').includes(s.id)):inputProps.scenes;
 if(sceneFilter&&!selectedScenes.length)throw new Error('Unknown scene: '+sceneFilter);
 const frames=[45,...selectedScenes.flatMap(s=>[Math.round((s.start+.3)*30),Math.round((s.start+s.end)*15),Math.round((s.end-.3)*30),...s.states.map(v=>Math.round((s.start+v.t+.2)*30))])];
 for(const frame of [...new Set(frames)]) await renderStill({...opts,frame,output:path.join(folder,'frame-'+frame+'.jpg'),imageFormat:'jpeg',jpegQuality:95});
 console.log('Reviewed stills ready:',format);
 if(process.argv[2]!=='stills')await renderMedia({...opts,codec:'h264',crf:19,concurrency:2,outputLocation:path.join(folder,'silent.mp4'),onProgress:({progress})=>{if(progress===1)console.log('Rendered:',format)}});
}} finally {await browser.close({silent:true});}
