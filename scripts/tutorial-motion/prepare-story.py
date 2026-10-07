from pathlib import Path
import json, runpy, math, shutil, numpy as np
from PIL import Image
R=Path.cwd(); W=R/'.data/video-story'; O=R/'assets/tutorial-story'; H=runpy.run_path(str(R/'scripts/build-real-tutorial.py')); SR=48000
(W/'tts/full').mkdir(parents=True,exist_ok=True)
(W/'public').mkdir(parents=True,exist_ok=True)
for p in (O/'narration').glob('*.wav'): shutil.copyfile(p,W/'tts/full'/p.name)
for p in (O/'captures').glob('*.png'): shutil.copyfile(p,W/'public'/p.name)
phrases=dict(json.loads((O/'narration/phrases.json').read_text(encoding='utf-8')))
blocks=[('marcas','aprobados','Marca tus ramos',['intro','approved','current']),('caminos','eligible','Mira qué se abriría',['paths','condition']),('agenda','semana','Agrega tu control',['week','form']),('inicio','inicio','Ya está en tu Inicio',['home']),('ramos','mis-ramos','Todo a mano en Mis ramos',['courses'])]
def audio(ids,folder):
 folder.mkdir(parents=True,exist_ok=True); segments=[];cues=[];beats={};cursor=0
 for ident in ids:
  raw=W/'tts/full'/f'{ident}.wav'; wav=folder/f'{ident}.wav';H['run'](['-i',raw,'-ar',SR,'-ac',1,wav]);a=H['wav_read'](wav);active=np.flatnonzero(abs(a[:,0])>.002);a=a[max(0,active[0]-int(.06*SR)):min(len(a),active[-1]+int(.12*SR))]
  dur=math.ceil((len(a)/SR+.28)*30)/30;beats[ident]=cursor;cues.append({'start':cursor,'end':cursor+len(a)/SR,'text':phrases[ident]});segments.append(np.pad(a,((0,round(dur*SR)-len(a)),(0,0))));cursor+=dur
 joined=np.concatenate(segments);H['wav_write'](folder/'voice.wav',joined);return cues,beats,cursor
if __name__=='__main__':
 for lesson in ['semestre']:
  (W/lesson).mkdir(parents=True,exist_ok=True)
  shutil.copyfile(O/'narration'/f'{lesson}-alignment.json',W/lesson/'alignment.json')
 for lesson,ids in [('semestre',[x for b in blocks for x in b[3]])]:
  if not all((W/'tts/full'/f'{i}.wav').exists() for i in ids):raise SystemExit('Audio pending')
  cues,beats,total=audio(ids,W/lesson);(W/lesson/'timing.json').write_text(json.dumps({'captions':cues,'beats':beats,'duration':total},ensure_ascii=False),encoding='utf-8')
  print(lesson,total,beats)
