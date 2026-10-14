"""Reproduce the news video from real CUA captures and the saved continuous voice.
Run --prepare, scripts/tutorial-motion/render-news.mjs, then --finalize.
No paid calls; speech was generated once and archived with the source assets.
"""
from pathlib import Path
import argparse,json,runpy,shutil
from PIL import Image
R=Path(__file__).resolve().parents[1];W=R/'.data/news-video';O=R/'assets/tutorial-news'
H=runpy.run_path(str(R/'scripts/build-real-tutorial.py'));run=H['run'];sha=H['sha']
SCALE=1/.9
captions=[(0,2.02,'Hay novedades en el portal del CEIC'),(2.02,3.54,'para organizar tu semestre en Civil.'),(3.9,6.82,'Elige tu plan y marca en amarillo los ramos que cursas.'),(7.2,8.58,'Y en verde los que aprobaste.'),(9.16,11.8,'En Mis ramos tienes su material y actividades.'),(12.38,14.9,'Qué se abre muestra qué podrías cursar'),(14.9,16.26,'si apruebas tus actuales.'),(16.56,19.78,'Mecánica de Suelos 1 abre Mecánica de Suelos 2.'),(20.36,21.86,'Confirma la oferta con la universidad.'),(22.52,24.56,'En Mi semana, agrega un control'),(24.56,26.62,'con nombre, fecha y ramo.'),(26.96,29.38,'Los plazos UCN aparecen juntos, con sus fechas.'),(30.02,32.48,'Inicio reúne tus próximas actividades y ramos.'),(32.92,34.6,'Tus datos quedan en este navegador.'),(34.94,36.8,'Puedes descargar una copia desde Mi semana.'),(37.3,38.24,'Entra al portal del CEIC.')]
def prepare():
 W.mkdir(parents=True,exist_ok=True);(W/'public').mkdir(exist_ok=True)
 for p in (O/'captures').glob('*.png'):shutil.copyfile(p,W/'public'/p.name)
 run(['-i',O/'narration/narration.wav','-af','atempo=0.90,loudnorm=I=-16:TP=-2:LRA=7,apad=pad_dur=1.6','-ar',48000,'-ac',1,W/'voice.wav'])
 total=round(H['duration'](W/'voice.wav'),3)
 cs=[dict(start=round(a*SCALE,3),end=round(b*SCALE,3),text=t) for a,b,t in captions]
 for fmt in ['desktop','mobile']:
  scenes=[]
  def scene(id,title,start,end,names,rect=None):
   first=O/'captures'/f'{fmt}-{names[0][1]}.png';width,height=Image.open(first).size
   states=[]
   for t,name in names:
    p=O/'captures'/f'{fmt}-{name}.png';w,h=Image.open(p).size
    states.append(dict(t=round((t-start)*SCALE,3),image=p.name,width=w,height=h,transition='cut'))
   if rect is None:rect=(0,0,width,height)
   # Rectangles refer to the real source screenshots, never invented UI.
   camera=[dict(t=0,x=rect[0],y=rect[1],w=rect[2],h=rect[3])]
   scenes.append(dict(id=id,title=title,start=round(start*SCALE,3),end=round(end*SCALE,3),space=dict(width=width,height=height),states=states,camera=camera,transitionIn=.18))
  mobile=fmt=='mobile'
  scene('introduccion','Novedades del portal',0,3.9,[(0,'malla-before')],(0,200,390,620) if mobile else (220,40,1200,740))
  if mobile:
   scene('marcas','Marca tus ramos',3.9,9.16,[(3.9,'malla-current-before'),(5.1,'malla-current'),(7.1,'malla-approved')],(0,285,390,540))
  else:
   scene('marcas','Marca tus ramos',3.9,9.16,[(3.9,'malla-before'),(5.1,'malla-current'),(7.1,'malla-current')],(650,600,440,180))
   scenes[-1]['camera']=[dict(t=0,x=250,y=70,w=1140,h=780),dict(t=.6,x=250,y=70,w=1140,h=780),dict(t=1.4,x=650,y=600,w=440,h=180)]
  scene('ramos','Todo a mano en Mis ramos',9.16,12.38,[(9.16,'courses')],(0,175,390,590) if mobile else (250,145,1010,590))
  scene('caminos','Qué se abriría',12.38,22.52,[(12.38,'paths')],(15,195,355,560) if mobile else (260,315,730,330))
  if not mobile:scenes[-1]['camera']=[dict(t=0,x=260,y=260,w=960,h=530),dict(t=1.3,x=260,y=315,w=730,h=330),dict(t=4.6,x=560,y=360,w=415,h=245),dict(t=8.3,x=260,y=315,w=730,h=360)]
  scene('formulario','Agrega una actividad',22.52,26.96,[(22.52,'week-empty'),(24.35,'week-name'),(25.6,'week-date'),(26.25,'week-linked')],(15,45,350,460) if mobile else (1010,410,350,335))
  if mobile:scenes[-1]['camera']=[dict(t=0,x=15,y=45,w=350,h=460),dict(t=3.6,x=15,y=45,w=350,h=460),dict(t=4.25,x=15,y=210,w=350,h=460)]
  scene('agenda','Tu semana, más clara',26.96,30.02,[(26.96,'week-saved')],(5,290,369,445) if mobile else (250,450,730,360))
  scene('inicio','Tus próximas actividades',30.02,34.94,[(30.02,'home')],(10,270,360,475) if mobile else (260,290,1110,310))
  scene('copia','Guarda una copia de tu avance',34.94,37.3,[(34.94,'backup')],(0,285,379,440) if mobile else (270,570,1020,260))
  scene('cierre','Tu semestre, a mano',37.3,total/SCALE,[(37.3,'home')])
  (W/f'{fmt}.json').write_text(json.dumps(dict(format=fmt,scenes=scenes,captions=cs),ensure_ascii=False,indent=2),encoding='utf-8')
 (O/'narration/timing.json').write_text(json.dumps(dict(duration=total,speechRate=.9,captions=cs),ensure_ascii=False,indent=2),encoding='utf-8')
 print('Prepared:',total,'seconds')
def finalize():
 timing=json.loads((O/'narration/timing.json').read_text(encoding='utf-8'));total=timing['duration']
 M=dict(version=7,captureMethod='computer-use',capturedAt='2026-10-13',fps=30,openCaptions=True,formats={})
 reports={}
 for fmt,size in [('desktop',(1920,1080)),('mobile',(1080,1920))]:
  folder=O/fmt;folder.mkdir(exist_ok=True);output=folder/'novedades-voice.mp4'
  run(['-i',W/fmt/'silent.mp4','-i',W/'voice.wav','-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','19','-vf','scale=in_range=pc:out_range=tv','-pix_fmt','yuv420p','-g','30','-bf','0','-c:a','aac','-b:a','160k','-t',total,'-movflags','+faststart','-map_metadata','-1',output])
  assert output.stat().st_size<24*1024*1024
  run(['-i',output,'-f','null','-'])
  props=json.loads((W/f'{fmt}.json').read_text(encoding='utf-8'));steps=[]
  for s in props['scenes']:
   frame=W/fmt/f"frame-{round((s['end']-.3)*30)}.jpg";target=folder/f"{s['id']}-{sha(frame)[:12]}.jpg";shutil.copyfile(frame,target)
   source=O/'captures'/s['states'][-1]['image'];steps.append(dict(id=s['id'],chapter=s['id'],image=target.relative_to(R).as_posix(),sha256=sha(target),sourceImage=source.relative_to(R).as_posix(),sourceSha256=sha(source),start=s['start'],end=s['end'],caption=s['title']))
  poster=folder/f"portada-{sha(W/fmt/'frame-45.jpg')[:12]}.jpg";shutil.copyfile(W/fmt/'frame-45.jpg',poster)
  vtt=folder/'novedades.vtt';vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f"{i+1}\n{H['vtt_time'](c['start'])} --> {H['vtt_time'](c['end'])}\n{c['text']}" for i,c in enumerate(timing['captions']))+'\n',encoding='utf-8')
  video=output.relative_to(R).as_posix()+'?v='+sha(output)[:12]
  M['formats'][fmt]=dict(width=size[0],height=size[1],duration=total,steps=steps,variants=dict(voice=video),video=video,poster=poster.relative_to(R).as_posix(),track=vtt.relative_to(R).as_posix()+'?v='+sha(vtt)[:12])
  reports[fmt]=dict(bytes=output.stat().st_size,duration=H['duration'](output),sha256=sha(output),decoded=True)
 (R/'assets/tutorial-story/manifest.js').write_text('window.PortalTutorialCapture = Object.freeze('+json.dumps(M,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
 (W/'media-verification.json').write_text(json.dumps(reports,indent=2),encoding='utf-8');print('Exported and decoded both formats:',reports)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--prepare',action='store_true');p.add_argument('--finalize',action='store_true');a=p.parse_args()
 if a.prepare:prepare()
 if a.finalize:finalize()
