"""Mux the reviewed Remotion outputs, verify streams, and publish their manifest."""
from pathlib import Path
import json, runpy, shutil

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.data/video-motion/render'
OUT = ROOT / 'assets/tutorial-motion'
H = runpy.run_path(str(ROOT / 'scripts/build-real-tutorial.py'))
run, sha = H['run'], H['sha']
timing = json.loads((WORK/'timing.json').read_text(encoding='utf-8'))
total = timing['steps'][-1]['end']
manifest = dict(version=4, captureMethod='computer-use', capturedAt='2026-10-05',
                fps=30, openCaptions=True, audio=timing['audio'], formats={})
for fmt, size in [('desktop',(1920,1080)),('mobile',(1080,1920))]:
    folder = OUT / fmt
    folder.mkdir(parents=True, exist_ok=True)
    silent = folder/'recorrido.mp4'
    run(['-i',WORK/(fmt+'-silent.mp4'),'-map','0:v:0','-c','copy','-an',
         '-movflags','+faststart','-map_metadata','-1',silent])
    variants = dict(silent=silent.relative_to(ROOT).as_posix())
    for kind in ('voice','music','voiceMusic'):
        target = folder/('recorrido-'+kind+'.mp4')
        run(['-i',silent,'-i',WORK/(kind+'.wav'),'-map','0:v:0','-map','1:a:0',
             '-c:v','copy','-c:a','aac','-b:a','160k','-t',total,
             '-movflags','+faststart','-map_metadata','-1',target])
        variants[kind] = target.relative_to(ROOT).as_posix()
    props = json.loads((WORK/(fmt+'.json')).read_text(encoding='utf-8'))
    steps = []
    for item, scene in zip(timing['steps'], props['scenes']):
        target = folder/(item['id']+'.jpg')
        shutil.copyfile(WORK/fmt/(item['id']+'-0.88.jpg'),target)
        name = Path(scene['states'][-1]['image']).name
        source = OUT/'captures'/name
        if not source.exists():
            source = ROOT/'assets/tutorial-novedades/captures'/name
        steps.append(dict(id=item['id'],chapter=item['chapter'],image=target.relative_to(ROOT).as_posix(),
            sha256=sha(target),sourceImage=source.relative_to(ROOT).as_posix(),sourceSha256=sha(source),
            caption=item['caption'],start=round(item['start'],3),end=round(item['end'],3),
            voiceDuration=round(item['voiceDuration'],3)))
    track = folder/'recorrido.vtt'
    vt = H['vtt_time']
    track.write_text('WEBVTT\n\n'+'\n\n'.join(
        f"{i+1}\n{vt(c['start'])} --> {vt(c['end'])}\n{c['text']}" for i,c in enumerate(timing['captions']))+'\n',encoding='utf-8')
    manifest['formats'][fmt] = dict(width=size[0],height=size[1],duration=round(total,3),steps=steps,
        variants=variants,video=variants['silent'],track=track.relative_to(ROOT).as_posix())
report = H['verify_media'](manifest)
(WORK/'media-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
for recording in manifest['formats'].values():
    recording['variants'] = {k:v+'?v='+sha(ROOT/v)[:12] for k,v in recording['variants'].items()}
    recording['video'] = recording['variants']['silent']
    recording['track'] += '?v='+sha(ROOT/recording['track'])[:12]
(OUT/'manifest.js').write_text('window.PortalTutorialCapture = Object.freeze('+json.dumps(manifest,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
print(json.dumps(report,indent=2))
