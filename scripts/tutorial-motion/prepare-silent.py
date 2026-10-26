from pathlib import Path
import json,shutil,hashlib
from PIL import Image
R=Path.cwd();W=R/'output/release-20261026/tutorial-silent/work';O=R/'assets/tutorial-silent';S=R/'assets/tutorial-news/captures'
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
 add('copia',56,62,'Guarda una copia',[(0,'backup')],(0,285,379,440) if mobile else (270,570,1020,260))
 cap(56,59,'9/9 · En Mi semana, baja hasta Guarda tu avance.')
 cap(59,62,'Pulsa Descargar una copia. Tus datos quedan en este navegador.')
 (W/(fmt+'.json')).write_text(json.dumps(dict(format=fmt,scenes=scenes,captions=captions,news=True,silent=True),ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared silent guide: 62 seconds; sources unchanged')
