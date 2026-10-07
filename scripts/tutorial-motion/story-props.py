from pathlib import Path
import json
from PIL import Image
R=Path.cwd();W=R/'.data/video-story';P=W/'public'
def sz(n):return Image.open(P/(n+'.png')).size
def state(n,t=0):
 w,h=sz(n);return dict(t=t,image=n+'.png',width=w,height=h,transition='cut',offsetY={'week-name':-59,'week-time':11,'week-linked':11}.get(n,0))
def key(t,r):return dict(t=t,**dict(zip(['x','y','w','h'],r)))
T=json.loads((W/'semestre/timing.json').read_text(encoding='utf-8')); B=T['beats']
# Seconds refer to narration boundaries; precise word anchors are applied below when available.
align=W/'semestre/alignment.json'
words=[w for s in json.loads(align.read_text(encoding='utf-8'))['segments'] for w in s['words']] if align.exists() else []
def at(word,lo,hi,fallback):
 hits=[w['start'] for w in words if lo<=w['start']<=hi and word.lower() in w['word'].lower()];return hits[0] if hits else fallback
approved=at('aprob',B['approved'],B['current'],B['approved']+1);current=at('cursando',B['current'],B['paths'],B['current']+1);name=at('nombre',B['form'],B['home'],B['form']+.6);date=at('fecha',B['form'],B['home'],B['form']+1.6);linked=at('ramo',B['form'],B['home'],B['form']+3.4);save=at('guarda',B['form'],B['home'],B['home']-.6)
for fmt in ['desktop','mobile']:
 scenes=[]
 def add(id,title,chapter,start,end,states,camera,cursor=[]):
  w,h=sz(states[0][1]);scenes.append(dict(id=id,title=title,start=start,end=end,space=dict(width=w,height=h),states=[state(n,t-start) for t,n in states],camera=[key(t-start,r) for t,r in camera],cursor=[dict(t=t-start,x=x,y=y,click=c) for t,x,y,c in cursor],transitionIn=.15))
 m=(230,60,700,510) if fmt=='desktop' else (235,70,360,540)
 add('marcas','Marca tus ramos','aprobados',0,B['paths'],[(0,'malla-before'),(approved,'malla-approved'),(B['current'],'malla-current-mode'),(current,'malla-current')],[(0,(220,0,1660,820)),(1.1,m),(B['paths'],m)],[(approved-.7,495,115,False),(approved,318,410,True),(B['current'],385,115,True),(current,473,411,True)])
 path=(435,90,1260,620) if fmt=='desktop' else (435,180,610,660)
 add('caminos','Mira qué se abriría','eligible',B['paths'],B['week'],[(B['paths'],'paths')],[(B['paths'],path),(B['condition'],path)])
 form=(1255,230,450,610)
 add('agenda','Agrega tu control','semana',B['week'],B['home'],[(B['week'],'week-empty'),(name,'week-name'),(date,'week-time'),(linked,'week-linked'),(save,'week-saved')],[(B['week'],(420,80,1260,690)),(B['form']-.3,form),(save-.3,form),(save+.55,(430,340,850,450))],[(name,1470,440,True),(date,1390,350,True),(linked,1460,609,True),(save,1360,786,True)])
 home=(425,110,1250,470) if fmt=='desktop' else (440,150,610,500)
 add('inicio','Ya está en tu Inicio','inicio',B['home'],B['courses'],[(B['home'],'home')],[(B['home'],home)])
 course=(430,190,900,480) if fmt=='desktop' else (430,210,460,490)
 add('ramos','Todo a mano en Mis ramos','mis-ramos',B['courses'],T['duration'],[(B['courses'],'courses')],[(B['courses'],course)])
 (W/'semestre'/f'{fmt}.json').write_text(json.dumps(dict(format=fmt,scenes=scenes,captions=T['captions']),ensure_ascii=False),encoding='utf-8')

print("Semester props ready",len(words),"alignment words")
