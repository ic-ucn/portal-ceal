from pathlib import Path
import json,shutil,hashlib
from PIL import Image
R=Path.cwd();W=R/'output/release-20261026/tutorial-guided/work';O=R/'assets/tutorial-guided';S=R/'assets/tutorial-news/captures'
W.mkdir(parents=True,exist_ok=True);(W/'public').mkdir(exist_ok=True);O.mkdir(exist_ok=True)
for p in S.glob('*.png'):shutil.copyfile(p,W/'public'/p.name)
for p in (O/'sources').glob('*.png'):shutil.copyfile(p,W/'public'/p.name)
for fmt in ['desktop','mobile']:
 mobile=fmt=='mobile';scenes=[];captions=[]
 def add(id,start,end,title,states,rect,zoom=True):
  p=S/(fmt+'-'+states[0][1]+'.png');w,h=Image.open(p).size
  cams=[dict(t=0,x=rect[0],y=rect[1],w=rect[2],h=rect[3])]
  if zoom:
   x,y,rw,rh=rect;cams.append(dict(t=1.2,x=x+rw*.025,y=y+rh*.025,w=rw*.95,h=rh*.95,ease='out'))
  scenes.append(dict(id=id,title=title,start=start,end=end,space=dict(width=w,height=h),states=[dict(t=t,image=fmt+'-'+name+'.png',width=Image.open(S/(fmt+'-'+name+'.png')).width,height=Image.open(S/(fmt+'-'+name+'.png')).height,transition='cut') for t,name in states],camera=cams,transitionIn=.4))
 def cap(a,b,t):captions.append(dict(start=a,end=b,text=t))
 add('malla',0,6,'Abre la malla',[(0,'malla-before')],(0,80,390,650) if mobile else (220,20,1180,720))
 cap(0,6,'1/9 · Abre Malla y elige Plan O o Plan P.')
 add('aprobados',6,13,'Marca aprobados',[(0,'malla-before'),(4,'malla-approved')],(0,240,390,570) if mobile else (590,550,520,250),False)
 if not mobile:scenes[-1]['camera']=[dict(t=0,x=235,y=55,w=600,h=180),dict(t=2,x=235,y=55,w=600,h=180),dict(t=3.3,x=590,y=550,w=520,h=250,ease='inOut')]
 cap(6,9,'2/9 · Pulsa Aprobados y toca un ramo aprobado.')
 cap(9,13,'El ramo queda marcado en verde.')
 add('actuales',13,20,'Marca actuales',[(0,'malla-current-before' if mobile else 'malla-approved'),(4,'malla-current')],(0,240,390,570) if mobile else (590,550,520,250),False)
 if not mobile:scenes[-1]['camera']=[dict(t=0,x=235,y=55,w=600,h=180),dict(t=2,x=235,y=55,w=600,h=180),dict(t=3.3,x=590,y=550,w=520,h=250,ease='inOut')]
 if mobile:scenes[-1]['camera'].extend([dict(t=5.2,x=0,y=240,w=390,h=570),dict(t=6.0,x=0,y=90,w=390,h=570,ease='inOut')])
 else:scenes[-1]['camera'].extend([dict(t=5.0,x=590,y=550,w=520,h=250),dict(t=5.8,x=700,y=0,w=650,h=220,ease='inOut')])
 cap(13,16,'3/9 · Pulsa Actuales y toca los ramos que cursas.')
 cap(16,18,'Quedan marcados en amarillo.')
 cap(18,20,'Pulsa Terminar marcado para salir de la edición.')
 add('ramos',20,26,'Mis ramos',[(0,'courses')],(0,170,390,590) if mobile else (250,145,1010,590))
 cap(20,26,'4/9 · En Mis ramos, abre Material o agrega una actividad.')
 add('caminos',26,34,'Qué se abre',[(0,'paths-clean')],(10,220,365,515) if mobile else (260,315,730,330))
 cap(26,30,'5/9 · Abre Qué se abre para ver tu proyección.')
 cap(30,34,'Si apruebas Suelos 1, podrías cursar Suelos 2.')
 add('formulario',34,46,'Crea una actividad',[(0,'form-clean-empty'),(2,'form-clean-typing1'),(2.7,'form-clean-typing2'),(3.5,'form-clean-name'),(6,'form-clean-date'),(9,'form-clean-linked')],(24,29,315,396) if mobile else (1000,320,390,370),False)
 if mobile:scenes[-1]['camera'].append(dict(t=9,x=16,y=255,w=347,h=480,ease='cut'))
 else:scenes[-1]['camera'].append(dict(t=9,x=1000,y=540,w=390,h=330,ease='cut'))
 cap(34,38,'6/9 · En Mi semana, pulsa Agregar actividad. Escribe el nombre.')
 cap(38,42,'Elige la fecha de tu actividad.')
 cap(42,46,'Selecciona el ramo y pulsa Agregar.')
 add('guardada',46,51,'Actividad guardada',[(0,'week-saved')],(5,290,369,445) if mobile else (250,450,730,360))
 cap(46,51,'7/9 · Revisa tu actividad guardada en la semana.')
 add('inicio',51,56,'Consulta Inicio',[(0,'home')],(10,270,360,475) if mobile else (260,290,1110,310))
 cap(51,56,'8/9 · Inicio reúne tus próximas actividades y ramos.')
 add('copia',56,62,'Guarda una copia',[(0,'backup')],(0,285,379,440) if mobile else (245,570,1020,260))
 cap(56,59,'9/9 · En Mi semana, baja hasta Guarda tu avance.')
 cap(59,62,'Pulsa Descargar una copia. Tus datos quedan en este navegador.')
 (W/(fmt+'.json')).write_text(json.dumps(dict(format=fmt,scenes=scenes,captions=captions,news=True,silent=True),ensure_ascii=False,indent=2),encoding='utf-8')

# Explicit actions in screenshot coordinates. No invisible or inferred targets.
for fmt in ['desktop','mobile']:
 mobile=fmt=='mobile';p=W/(fmt+'.json');data=json.loads(p.read_text(encoding='utf-8'));sc=data['scenes']
 def state(t,name):
  im=fmt+'-'+name+'.png';w,h=Image.open(W/'public'/im).size
  return dict(t=t,image=im,width=w,height=h,transition='cut')
 def cam(t,rect):return dict(t=t,x=rect[0],y=rect[1],w=rect[2],h=rect[3],ease='inOut')
 def actions(s,groups):
  s['cursor']=[];s['cursorWindows']=[]
  for group in groups:
   s['cursorWindows'].append(dict(start=group[0][0]-.35,end=group[-1][0]+.58))
   for t,x,y,click in group:s['cursor'].append(dict(t=t,x=x,y=y,click=click))
 def action(t,x,y):return [(t-.45,x-18,y+16,False),(t,x,y,True)]
 header=(0,70,390,320) if mobile else (235,0,980,235)
 cards=(0,440,390,280) if mobile else (590,550,520,250)
 sc[0]['states']=[state(0,'malla-unmarked'),state(4.55,'malla-before')]
 sc[0]['camera']=[cam(0,(0,0,390,560) if mobile else (220,0,1180,720)),cam(2.8,header)]
 actions(sc[0],[action(4.35,160 if mobile else 1080,240 if mobile else 40)])
 data['captions'][0]['text']='1/9 · Abre Malla, elige tu plan y pulsa Marcar ramos.'
 sc[1]['camera']=[cam(0,header),cam(1.4,header),cam(2.5,cards)]
 sc[1]['states']=[state(0,'malla-before'),state(4,'malla-approved')]
 actions(sc[1],[action(.95,282 if mobile else 512,311 if mobile else 115),action(3.8,277 if mobile else 730,601 if mobile else 680)])
 sc[2]['states']=[state(0,'malla-approved'),state(1.25,'malla-actual-mode'),state(2.4,'malla-solid-before'),state(3.3,'malla-solid-after'),state(3.9,'malla-current-before'),state(4.6,'malla-current'),state(6.25,'malla-finished')]
 sc[2]['camera']=[cam(0,header),cam(1.3,header),cam(2.4,cards),cam(4.7,cards),cam(5.65,header)]
 actions(sc[2],[action(1.05,165 if mobile else 392,311 if mobile else 115),action(3.1,277 if mobile else 866,600 if mobile else 680),action(4.4,277 if mobile else 1005,600 if mobile else 680),action(6.05,165 if mobile else 1070,240 if mobile else 40)])
 sc[3]['states']=[state(0,'malla-finished'),state(1.0,'courses')]
 sc[3]['camera']=[cam(0,header),cam(1,header),cam(2,(0,170,390,590) if mobile else (250,145,1010,590))]
 actions(sc[3],[action(.8,277 if mobile else 960,183 if mobile else 40),[(3,68 if mobile else 310,480 if mobile else 380,False)]])
 sc[4]['states']=[state(0,'courses'),state(1.1,'paths-clean')]
 sc[4]['camera']=[cam(0,(0,160,390,220) if mobile else (250,75,730,220)),cam(1.2,(0,160,390,220) if mobile else (250,75,730,220)),cam(2.3,(10,220,365,515) if mobile else (260,315,730,330))]
 actions(sc[4],[action(.9,175 if mobile else 438,238 if mobile else 137),[(3.1,265 if mobile else 395,285 if mobile else 502,False)]])
 # Fields precede their recorded values; the final click precedes the saved state.
 sc[5]['states']=[state(0,'form-clean-empty'),state(2,'form-clean-typing1'),state(2.7,'form-clean-typing2'),state(3.5,'form-clean-name'),state(6,'form-clean-date'),state(9,'form-clean-linked')]
 sc[5]['camera']=[sc[5]['camera'][0],cam(7.3,(24,29,315,396) if mobile else (1000,320,390,370)),cam(8.35,(16,255,347,480) if mobile else (1000,540,390,330))]
 actions(sc[5],[action(1.5,155 if mobile else 1130,317 if mobile else 540),action(5.7,150 if mobile else 1090,151 if mobile else 450),action(8.7,180 if mobile else 1170,566 if mobile else 710),action(11.65,190 if mobile else 1065,678 if mobile else 825)])
 # Result holds remain quiet. Start next navigation in the saved screenshot.
 sc[6]['cursor']=[]
 sc[7]['states']=[state(0,'week-saved'),state(1.1,'home')]
 sc[7]['camera']=[cam(0,(0,0,390,844) if mobile else (0,0,1440,900)),cam(1.2,(0,0,390,844) if mobile else (0,0,1440,900)),cam(2.3,(10,270,360,475) if mobile else (260,290,1110,310))]
 actions(sc[7],[action(.9,49 if mobile else 80,790 if mobile else 118)])
 actions(sc[8],[action(4.1,190 if mobile else 357,492 if mobile else 750)])
 if mobile:
  # Natural page scrolling leaves the header above the viewport; explicit top
  # states return to controls before a tap, and card states show the real scroll.
  sc[0]['states']=[state(0,'malla-unmarked'),state(4.55,'malla-marked-top')]
  sc[1]['states']=[state(0,'malla-marked-top'),state(2.5,'malla-before'),state(4,'malla-approved')]
  sc[1]['camera']=[cam(0,header),cam(1.6,header),cam(2.5,(0,240,390,420))]
  actions(sc[1],[action(.95,284,311),action(3.8,277,412)])
  sc[2]['states']=[state(0,'malla-approved-top'),state(1.25,'malla-actual-mode'),state(2.4,'malla-solid-before'),state(3.3,'malla-solid-after'),state(3.9,'malla-current-before'),state(4.6,'malla-current'),state(5.4,'malla-current-top'),state(6.25,'malla-finished')]
  sc[2]['camera']=[cam(0,header),cam(1.3,header),cam(2.4,(0,240,390,420)),cam(4.7,(0,240,390,420)),cam(5.65,header)]
  actions(sc[2],[action(1.05,165,311),action(3.1,277,412),action(4.4,277,673),action(6.05,165,240)])
 def clean(v):
  if isinstance(v,str):
   for _ in range(4):
    if not ('\u00c3' in v or '\u00c2' in v):break
    try:v=v.encode('cp1252').decode('utf-8')
    except (UnicodeEncodeError,UnicodeDecodeError):break
   return v
  if isinstance(v,list):return [clean(x) for x in v]
  if isinstance(v,dict):return {k:clean(x) for k,x in v.items()}
  return v
 p.write_text(json.dumps(clean(data),ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared guided version with exact screenshot targets and independent cursor windows.')
