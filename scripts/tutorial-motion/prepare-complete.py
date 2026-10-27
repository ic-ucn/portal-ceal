"""Build the complete 62-second guide from reviewed native screenshot states."""
from pathlib import Path
import copy,json,shutil,hashlib,subprocess,sys
from PIL import Image
R=Path(__file__).resolve().parents[2]
W=R/'output/release-20261026/tutorial-complete/work'
O=R/'assets/tutorial-complete'
G=R/'output/release-20261026/tutorial-guided/work'
if not (G/'desktop.json').exists():subprocess.run([sys.executable,str(R/'scripts/tutorial-motion/prepare-guided.py')],cwd=R,check=True)
(W/'public').mkdir(parents=True,exist_ok=True)
(O/'sources').mkdir(parents=True,exist_ok=True)
provenance=[]
for fmt in ['desktop','mobile']:
 mobile=fmt=='mobile'
 old=json.loads((G/(fmt+'.json')).read_text(encoding='utf-8'))
 lookup={s['id']:s for s in old['scenes']}
 def cam(t,r):return dict(t=t,x=r[0],y=r[1],w=r[2],h=r[3],ease='inOut')
 def state(name):
  im=fmt+'-'+name+'.png';source=O/'sources'/im
  if not source.exists():source=G/'public'/im
  w,h=Image.open(source).size
  return dict(t=0,image=im,width=w,height=h,transition='cut')
 def remake(id,start,end):
  s=copy.deepcopy(lookup[id]);factor=(end-start)/(s['end']-s['start'])
  for field in ['states','camera','cursor']:
   for item in s.get(field,[]):item['t']*=factor
  for win in s.get('cursorWindows',[]):
   win['start']*=factor;win['end']*=factor
  s.update(start=start,end=end);return s
 def point(s,groups):
  s['cursor']=[];s['cursorWindows']=[]
  for t,x,y in groups:
   s['cursor'] += [dict(t=t-.4,x=x-16,y=y+12),dict(t=t,x=x,y=y)]
   s['cursorWindows'].append(dict(start=t-.75,end=t+.7))
 home=(0,170,379,510) if mobile else (250,190,1130,520)
 intro=dict(id='novedades',title='Todas las novedades',start=0,end=5,states=[state('home')],camera=[cam(0,home),cam(4.4,(0,225,379,510) if mobile else (260,260,1100,490))],transitionIn=.3)
 malla=remake('malla',5,9)
 approved=remake('aprobados',9,13)
 current=remake('actuales',13,18)
 courses=remake('ramos',18,26)
 courses['camera']=[courses['camera'][0],{**courses['camera'][0],'t':1.4},cam(2.6,(0,270,379,510) if mobile else (250,230,790,360))]
 # The existing native card exposes Material and Agregar actividad. These
 # pointers identify the real access controls without inventing an opened view.
 first=courses['cursor'][:2]
 firstwin=courses['cursorWindows'][:1]
 point(courses,[(4.6,68 if mobile else 312,480 if mobile else 395),(6.5,150 if mobile else 425,535 if mobile else 451)])
 courses['cursor']=first+courses['cursor'];courses['cursorWindows']=firstwin+courses['cursorWindows']
 courses['states']=[courses['states'][0],{**state('courses-native'),'t':1.35},{**state('material-native'),'t':4.6}]
 ratio=courses['states'][1]['width']/courses['space']['width']
 initial={k:(v*ratio if k in ['x','y','w','h'] else v) for k,v in courses['camera'][0].items()}
 for key in first:key['x']*=ratio;key['y']*=ratio
 courses['space']={'width':courses['states'][1]['width'],'height':courses['states'][1]['height']}
 courses['camera']=[initial,{**initial,'t':1.35},cam(2.6,(0,270,379,510) if mobile else (250,230,790,360)),cam(4.59,(0,270,379,510) if mobile else (250,230,790,360)),{**cam(4.6,(8,75,355,480) if mobile else (250,90,1130,390)),'ease':'cut'},cam(5.0,(8,75,355,480) if mobile else (250,90,1130,390)),cam(6.0,(8,260,355,480) if mobile else (250,250,1130,390))]
 courses['cursor']=first+[dict(t=3.75,x=55 if mobile else 671,y=705 if mobile else 410),dict(t=4.35,x=67 if mobile else 685,y=691 if mobile else 395,click=True)]
 courses['cursorWindows']=firstwin+[dict(start=3.4,end=4.9)]
 paths=remake('caminos',26,34)
 form=remake('formulario',34,46)
 saved=remake('guardada',46,54)
 saved['states']=[state('activity-native'),{**state('activity-edit-native'),'t':2.5},{**state('activity-before-complete'),'t':5.0},{**state('activity-completed-native'),'t':6.0}]
 saved['camera']=[cam(0,(12,180,350,380) if mobile else (600,575,410,240)),{**cam(2.5,(12,100,350,500) if mobile else (990,470,390,300)),'ease':'cut'},{**cam(5,(12,180,350,380) if mobile else (610,50,380,220)),'ease':'cut'},{**cam(6,(12,100,350,400) if mobile else (610,50,380,220)),'ease':'cut'}]
 saved['cursor']=[dict(t=1.8,x=170 if mobile else 735,y=445 if mobile else 767),dict(t=2.3,x=184 if mobile else 752,y=434 if mobile else 753,click=True),dict(t=5.3,x=170 if mobile else 670,y=412 if mobile else 215),dict(t=5.8,x=184 if mobile else 685,y=399 if mobile else 203,click=True)]
 saved['cursorWindows']=[dict(start=1.5,end=2.8),dict(start=5.0,end=6.4)]
 deadlines=dict(id='plazos',title='Plazos oficiales UCN',start=54,end=58,states=[state('week-saved')],camera=[cam(0,(12,280,350,230) if mobile else (250,425,740,210))],transitionIn=.3)
 point(deadlines,[(2.0,73 if mobile else 916,420 if mobile else 540)])
 closing=dict(id='inicio',title='Todo en Inicio',start=58,end=62,states=[state('home-completed-native')],camera=[cam(0,home),cam(1.0,home),cam(3.8,(0,235,379,510) if mobile else (260,275,1100,470))],transitionIn=.3)
 scenes=[intro,malla,approved,current,courses,paths,form,saved,deadlines,closing]
 captions=[
  (0,5,'Novedades: Mis ramos, Material, Qué se abre y Mi semana.'),
  (5,9,'En Malla, elige tu plan y pulsa Marcar ramos.'),
  (9,13,'Elige Aprobados y toca el ramo: queda en verde.'),
  (13,16.5,'En Actuales, marca los ramos que cursas: quedan en amarillo.'),
  (16.5,18,'Pulsa Terminar marcado.'),
  (18,22,'Mis ramos reúne lo que cursas este semestre.'),
  (22,26,'Material se abre filtrado por el ramo que elegiste.'),
  (26,30,'Qué se abre muestra tu proyección según los prerrequisitos.'),
  (30,34,'Si apruebas Suelos 1, podrías cursar Suelos 2.'),
  (34,38,'En Mi semana, agrega una actividad y escribe su nombre.'),
  (38,42,'Elige la fecha de tu actividad.'),
  (42,46,'Selecciona el ramo y pulsa Agregar.'),
  (46,48,'Tu actividad queda guardada en la semana.'),
  (48,51,'Edita su nombre, fecha o ramo.'),
  (51,54,'Pulsa Completar cuando termines.'),
  (54,58,'Plazos UCN: revisa el rango y abre su fuente.'),
  (58,62,'Organiza tus ramos y tu semana en ceicucn.cl.'),
 ]
 # Only referenced sources enter the new package, preserving originals exactly.
 for im in sorted({st['image'] for s in scenes for st in s['states']}):
  source=O/'sources'/im
  if not source.exists():source=G/'public'/im
  shutil.copyfile(source,W/'public'/im)
  if source!=O/'sources'/im:shutil.copyfile(source,O/'sources'/im)
  digest=hashlib.sha256(source.read_bytes()).hexdigest()
  original=source;method='playwright';captured='2026-10-26'
  for base,candidate_method,candidate_date in [(R/'assets/tutorial-news/captures','computer-use','2026-10-13'),(R/'assets/tutorial-guided/sources','playwright','2026-10-26')]:
   candidate=base/im
   if candidate.exists() and hashlib.sha256(candidate.read_bytes()).hexdigest()==digest:
    original=candidate;method=candidate_method;captured=candidate_date;break
  provenance.append(dict(format=fmt,image=im,sha256=digest,originalSource=original.relative_to(R).as_posix(),captureMethod=method,capturedAt=captured))
 data=dict(format=fmt,scenes=scenes,captions=[dict(start=a,end=b,text=t) for a,b,t in captions],news=True,silent=True)
 serialized=json.dumps(data,ensure_ascii=False,indent=2)
 assert not any(word in serialized.lower() for word in ['backup','respaldo','copia'])
 (W/(fmt+'.json')).write_text(serialized,encoding='utf-8')
(W.parent/'source-integrity.json').write_text(json.dumps(dict(ok=True,sources=provenance),indent=2),encoding='utf-8')
print('Complete guide prepared: 10 scenes, 62 seconds, all new features, no backups.')
