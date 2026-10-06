import {bundle} from '@remotion/bundler';
import {openBrowser, selectComposition, renderStill, renderMedia} from '@remotion/renderer';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const work = path.join(root, '.data/video-motion/render');
const mode = process.argv[2] ?? 'stills';
const formats = process.argv[3] ? [process.argv[3]] : ['desktop','mobile'];
const serveUrl = await bundle({entryPoint:path.join(here,'src/index.tsx'),
  publicDir:path.join(root,'.data/video-motion/public'), outDir:path.join(work,'bundle'),
  enableCaching:true});
const browser = await openBrowser('chrome', {browserExecutable:path.join(root,
  'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe')});
try {
  for (const format of formats) {
    const inputProps = JSON.parse(await readFile(path.join(work,format+'.json'),'utf8'));
    const composition = await selectComposition({serveUrl,id:'Tutorial',inputProps,puppeteerInstance:browser});
    const common = {serveUrl,composition,inputProps,puppeteerInstance:browser};
    if (mode === 'stills') {
      await mkdir(path.join(work,format),{recursive:true});
      for (const scene of inputProps.scenes) {
        for (const fraction of [.1,.5,.88]) {
          const frame = Math.round((scene.start+(scene.end-scene.start)*fraction)*30);
          await renderStill({...common,frame,output:path.join(work,format,`${scene.id}-${fraction}.jpg`),imageFormat:'jpeg',jpegQuality:95});
        }
        console.log('Stills',format,scene.id);
      }
    } else {
      let last = -1;
      await renderMedia({...common,codec:'h264',crf:19,pixelFormat:'yuv420p',
        outputLocation:path.join(work,format+'-silent.mp4'),concurrency:2,
        onProgress:({progress})=>{const n=Math.floor(progress*10);if(n!==last){last=n;console.log(format,n*10+'%');}}});
      console.log('Rendered',format);
    }
  }
} finally { await browser.close({silent:true}); }
