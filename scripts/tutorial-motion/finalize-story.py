from pathlib import Path
import json,shutil,runpy,numpy as np
R=Path.cwd();W=R/'.data/video-story';O=R/'assets/tutorial-story';H=runpy.run_path(str(R/'scripts/build-real-tutorial.py'));run=H['run'];sha=H['sha'];vt=H['vtt_time']
M=dict(version=5,captureMethod='computer-use',capturedAt='2026-10-06',fps=30,openCaptions=True,lessons={})
(O/'captures').mkdir(parents=True,exist_ok=True)
for p in (W/'public').glob('*.png'):shutil.copyfile(p,O/'captures'/p.name)
reports={}
for lesson in ['semestre','notas']:
 timing=json.loads((W/lesson/'timing.json').read_text(encoding='utf-8'));total=timing['duration'];voice=H['wav_read'](W/lesson/'voice.wav')
 voice=voice.mean(axis=1,keepdims=True); voice*=.68/max(float(np.max(np.abs(voice))),1e-9)
 H['create_audio'].__globals__.update(WORK=W/lesson,VOICE='Google Aoede',VOICE_RATE='natural')
 audio=H['create_audio']([(voice,total,total,'cached')]);L=dict(audio=audio,formats={})
 for fmt,size in [('desktop',(1920,1080)),('mobile',(1080,1920))]:
  folder=O/lesson/fmt;folder.mkdir(parents=True,exist_ok=True);silent=folder/'recorrido.mp4';run(['-i',W/lesson/fmt/'silent.mp4','-c','copy','-an','-movflags','+faststart','-map_metadata','-1',silent]);variants={'silent':silent.relative_to(R).as_posix()}
  for kind in ['voice','music','voiceMusic']:
   target=folder/f'recorrido-{kind}.mp4';run(['-i',silent,'-i',W/lesson/f'{kind}.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-t',total,'-movflags','+faststart','-map_metadata','-1',target]);variants[kind]=target.relative_to(R).as_posix()
  props=json.loads((W/lesson/f'{fmt}.json').read_text(encoding='utf-8')); steps=[]
  if lesson=='semestre':
   specs=[('marcas','aprobados',0,timing['beats']['paths'],'malla-current',5.2),('caminos','eligible',timing['beats']['paths'],timing['beats']['week'],'paths',13),('agenda','semana',timing['beats']['week'],timing['beats']['home'],'week-saved',28),('inicio','inicio',timing['beats']['home'],timing['beats']['courses'],'home',30),('ramos','mis-ramos',timing['beats']['courses'],total,'courses',34)]
  else:specs=[('objetivo','notas',0,3.3,'mobile-empty' if fmt=='mobile' else 'empty',2.5),('ponderacion','notas',3.3,8.5333,'mobile-weight' if fmt=='mobile' else 'result',7.4),('resultado','notas',8.5333,total,'mobile-result' if fmt=='mobile' else 'result',14.5)]
  for id,chapter,start,end,source,still in specs:
   target=folder/f'{id}.jpg';shutil.copyfile(W/lesson/fmt/f'{still}.jpg',target);src=O/'captures'/f'{source}.png';caption=' '.join(c['text'] for c in timing['captions'] if start<=c['start']<end)
   steps.append(dict(id=id,chapter=chapter,image=target.relative_to(R).as_posix(),sha256=sha(target),sourceImage=src.relative_to(R).as_posix(),sourceSha256=sha(src),caption=caption,start=round(start,3),end=round(end,3),voiceDuration=round(end-start,3)))
  track=folder/'recorrido.vtt';track.write_text('WEBVTT\n\n'+'\n\n'.join(f"{i+1}\n{vt(c['start'])} --> {vt(c['end'])}\n{c['text']}" for i,c in enumerate(timing['captions']))+'\n',encoding='utf-8')
  L['formats'][fmt]=dict(width=size[0],height=size[1],duration=round(total,3),steps=steps,variants=variants,video=variants['silent'],track=track.relative_to(R).as_posix())
 reports[lesson]=H['verify_media'](L)
 for rec in L['formats'].values():
  rec['variants']={k:v+'?v='+sha(R/v)[:12] for k,v in rec['variants'].items()};rec['video']=rec['variants']['silent'];rec['track']+='?v='+sha(R/rec['track'])[:12]
 M['lessons'][lesson]=L
M['formats']=M['lessons']['semestre']['formats'];M['audio']=M['lessons']['semestre']['audio']
(O/'manifest.js').write_text('window.PortalTutorialCapture = Object.freeze('+json.dumps(M,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
(W/'media-verification.json').write_text(json.dumps(reports,indent=2),encoding='utf-8');print('Both lessons muxed and verified')
